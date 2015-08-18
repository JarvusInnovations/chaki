var path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
    fs = require('fs'),
    _ = require('underscore');

console.show = function () {
    console.log(arguments);
    console.log('\n');
};


console.hide = function (args) {
    return null;
};

module.exports = {
    installPackages : function (opts) {
        console.hide('[install] 1', opts);
        this.App = opts.app;

        var requestedPackage = this.App.args[1],
            method = opts.method || 'api';

        // @@TODO check for requested package 
        this._installPackages({method : method}, function (err) {
            if (err) {
                console.hide(err);
                return;
            }
            console.hide("Package installation complete!");
        });
    },

    // Loop through list of configured dependencies
    _installPackages : function (opts) {
        opts.trace = opts.trace || [];
        console.hide('[install] 2', opts);
        // setup state for current level
        // if opts.path is null, we get the args.app value, or just the script execute path
        var jsonPath, iter;

        if (opts.path) jsonPath = opts.path.concat('/app.json');
        var data = {},
            appJsonPath = this.App._getAppJsonPath(jsonPath), 
            that = this;
        data.appConfig = opts.appConfig || this.App._loadAppProperties(appJsonPath);
        data.method = opts.method || "api";
        data.trace = opts.trace || [];

        // figure out which packages iterate over
        // @@TODO create method for this / add test
        if (opts.requestedPackage) {
            console.show('a');
            iter = requestedPackage;
        } else if (opts.children && opts.children.length > 0) {
            console.show('b');
            iter = opts.children;
        } else {
            console.show('c');
            iter = data.appConfig.requires;
        }

        console.show('[install] 2.1', "iter", iter, "trace", opts.trace, "kids", opts.children);

        _.each(iter, function (packageName) {

            console.hide('[install] 2.2', packageName);
            data.packageName = packageName;
            that._installPackage(data, function (err, path) {
                if (!err) {
                    console.show("DO TRACE", path);
                    that._tracePackageDependencies({
                        packagePath : path,
                        method : data.method,
                        packageName : packageName,
                        trace : data.trace,
                        children : opts.children
                    });
                } else {
                    console.hide(err);
                }
            });
            // when we have recursed through the whole level, 
            // remove most recent trace item to travel up
            // one tree level
            if(iter.indexOf(packageName) + 1 == iter.length) {
                 data.trace.pop();
            }
        });
    },

    // Install single package and trace dependencies
    _installPackage : function (opts, fn) {
        console.hide('[install] 3', opts);
        var err,
            that = this,
            data = {},
            packagePath = this._getPackageInstallPath(opts);

        console.hide('[install] 3.1', packagePath, opts.trace.length);

        // if we're at trace length 0 (depth 0) use the app default package dir
        if (opts.trace.length > 0 && fs.existsSync(packagePath)) {
            err = 'Package already installed: ' + opts.packageName;
            return fn({err : err});
        }

        this._getPackageInfo(opts, function (err, packageInfo) {
            console.hide("[install] 5", err, packageInfo);
            if (err) return fn({err : err});

            data.path = 'https://github.com/'+packageInfo.data.GitHubPath+'.git';
            data.dest = packagePath;

            if (that._gitCloneRepo(data) !== 0) {
                console.show('Error: failed to clone from GitHub');
                return fn({error : true});
            } else {
                fs.mkdirSync(packagePath + 'packages/', that.App.depDirMode);
                return fn(null, packagePath); // send current path back up to trace dependencies
            }
        });
    },

    _gitCloneRepo : function (opts) {
         var code = (shell.exec('git clone ' + opts.path + ' ' + opts.dest).code); 
         console.show("GCR", code);
         return code;
    },

    // get package info from registry
    _getPackageInfo : function (opts, fn) {
        var err;
        var packageName = opts.packageName;

        console.hide("[install] 4", opts);
        // for tests we pass in module config
        if (opts.method === "test") {
            fn(null, this.App.mockApi[packageName]);
            // @@TODO get json from TEST
        } else {
            restler.get(this.App.registryUrl + packageName, {
                headers: {
                    Accept: 'application/json'
                }
            }).on('complete', function(responseData, response) {
                if (response.statusCode == 404) {
                    err = 'Error: Package "'+packageName+'" was not found on chaki.io';
                    return fn({err : err});
                } else if (response.statusCode != 200 || !responseData.success) {
                    err = 'Error: Failed to load package data from chaki.io, unknown problem (HTTP status '+response.statusCode+')';
                    return fn({err : err});
                }
                return fn(null, responseData);
            });
        }
    },

    // Returns path with trailing slash!
    // @@TODO this should match sencha conventions
    // @@TODO look at a real module with nested deps
    _getPackageInstallPath : function (opts) {
        console.hide('[Install] get package install path 1', opts);
        // start with app-level sencha generated path
        var packagePath = this.App.workspacePackagesPath + '/';

        if (opts.trace.length === 0) {
            packagePath += opts.packageName + '/';
        } else {
            _.each(opts.trace, function (bit) {
                packagePath += bit + '/packages/';
            });
            packagePath +=  opts.packageName + '/';
        }

        console.hide('[Install] get package install path 2', packagePath);
        return packagePath;
    },

    //
    _tracePackageDependencies : function (opts) {
        var that = this,
            trace = opts.trace || [];

        console.hide("[install] 6", opts);

        if (fs.existsSync(opts.packagePath + '/app.json')) {
            var appProperties = this.App._loadAppProperties(opts.packagePath + '/app.json');

            // if there are children, update trace path and recurse
            if (appProperties && appProperties.requires && appProperties.requires.length > 0) {
                trace.push(opts.packageName);
                console.show('[install 6.1]', trace, opts.packageName);
                that._installPackages({path : opts.packagePath, 
                                       method : opts.method,
                                       trace : trace,
                                       children : appProperties.requires
                                    });
            }
        }
    },
    
    // find branch most associated with sencha framework and version
    _findBestBranch : function (opts) {
        var senchaStuff = opts.senchaInfo,
            branches =  this._gitGetAllBranches(opts.dest),
            framework

        console.show("FBB 1", senchaStuff, branches);
    },

    _gitGetAllBranches : function (opts) {
        console.show("GGA1", opts);
        var ran,
            out;

        shell.cd(opts.dest);
        ran = shell.exec("git for-each-ref --format='%(refname:short)'");
        console.log(ran.output.split('\n'));
        out = ran.output.split('\n');
        _.each(out, function (ref) {
            ref.replace(/(\n|\r)+$/, '');
        });
        // parser(ran.output, function (err, data) {
        //     if (err) console.log (err);
        //     console.show("GGA2", data);
        //     out = data;
        // });
        return out;
    },

    // checkout the required version of the package
    _gitCheckoutBranch : function (opts) {
        var git1,
            git2;
        shell.cd(opts.path);
        git1 = shell.exec('git checkout -b ' + opts.branch);
        git2 = shell.exec('git pull origin ' + opts.branch);
        return ([git1, git2]);
    }
};