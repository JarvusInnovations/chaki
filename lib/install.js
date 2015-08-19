var path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
    fs = require('fs'),
    _ = require('underscore'),
    Git = require('../lib/git');

console.show = function () {
    console.log(arguments);
    console.log('\n');
};

module.exports = {
    installPackages : function (opts) {
        console.show('[install] 1', opts);
        this.App = opts.app;

        var requestedPackage = this.App.args[1],
            method = opts.method || 'api';

        // @@TODO check for requested package 
        this._installPackages({method : method}, function (err) {
            if (err) {
                console.show(err);
                return;
            }
            console.show("Package installation complete!");
        });
    },

    // Loop through list of configured dependencies
    _installPackages : function (opts) {
        opts.trace = opts.trace || []; // @@take this out
        console.show('[install] 2', opts);
        var iter,
            data = {},
            that = this;

        data.appJsonPath = this.App.getAppJsonPath(opts.path);
        data.appConfig = opts.appConfig || this.App._loadAppProperties(data.appJsonPath);
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

            console.show('[install] 2.2', packageName);
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
                    console.show(err);
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
        console.show('[install] 3', opts);
        var err,
            that = this,
            data = {},
            branch,
            packagePath = this._getPackageInstallPath(opts);

        console.show('[install] 3.1', packagePath, opts.trace.length);

        // if we're at trace length 0 (depth 0) use the app default package dir
        if (opts.trace.length > 0 && fs.existsSync(packagePath)) {
            err = 'Package already installed: ' + opts.packageName;
            return fn({err : err});
        }

        this._getPackageInfo(opts, function (err, packageInfo) {
            console.show("[install] 5", err, packageInfo);
            if (err) return fn({err : err});

            data.path = 'https://github.com/'+packageInfo.data.GitHubPath+'.git';
            data.dest = packagePath;
            data.senchaInfo = that.App.getSenchaInfo();
            if (Git.gitCloneRepo(data) !== 0) {
                console.show('Error: failed to clone from GitHub');
                return fn({error : true});
            } else {
                fs.mkdirSync(packagePath + 'packages/', that.App.depDirMode);
                branch = Git.getBestBranch(data);
                Git.gitCheckoutBranch({path : data.dest, branch : branch});
                return fn(null, packagePath); // send current path back up to trace dependencies
            }
        });
    },

    // get package info from registry
    // @@ put this in the chaki App?
    _getPackageInfo : function (opts, fn) {
        var err;
        var packageName = opts.packageName;

        console.show("[install] 4", opts);
        // for tests we pass in module config
        if (opts.method === "test") {
            fn(null, this.App.mockApi[packageName]);
            // @@TODO get json from TEST
        } else {
            restler.get(this.App.registryUrl + packageName, {
                headers: {
                    Accept: 'application/json',
                    AppId: 'foo'
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
        console.show('[Install] get package install path 1', opts);
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

        console.show('[Install] get package install path 2', packagePath);
        return packagePath;
    },

    //
    _tracePackageDependencies : function (opts) {
        var that = this,
            trace = opts.trace || [];

        console.show("[install] 6", opts);

        if (fs.existsSync(opts.packagePath + '/package.json')) {
            var appProperties = this.App._loadAppProperties(opts.packagePath + '/package.json');

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
    }
};