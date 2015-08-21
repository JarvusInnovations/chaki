var path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
    fs = require('fs'),
    _ = require('underscore'),
    Git = require('../lib/git');

console.show = function () {
    return null;
    console.log(arguments);
    console.log('\n');
};

module.exports = {
    installPackages : function (opts) {
        var that = this,
            data = ops;

        this.App = opts.app;

        data.method = opts.method || 'api';
        this._installPackages(data, function (err) {
            if (err) {
                that.App.log.warn(err);
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
            that = this
            requested = false;

        data.appJsonPath = this.App.getAppJsonPath(opts.path);
        data.appConfig = opts.appConfig || this.App.getAppProps();
        data.method = opts.method || "api";
        data.trace = opts.trace || [];

        // get iterable list of packages to install
        if (opts.requestedPackage) {
            console.show('a');
            iter = requestedPackage;
            requested = true;
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
                    that.App.updateAppJson(packageName);
                    that._tracePackageDependencies({
                        packagePath : path,
                        method : data.method,
                        packageName : packageName,
                        trace : data.trace,
                        children : opts.children
                    });
                } else {
                    that.App.log.warn(err);
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
        if (fs.existsSync(packagePath)) {
            err = 'Package already installed: ' + opts.packageName;
            return fn(err);
        }

        this._getPackageInfo(opts, function (err, packageInfo) {
            console.show("[install] 5", err, packageInfo);
            if (err) return fn(err);

            data.path = 'https://github.com/'+packageInfo.data.GitHubPath+'.git';
            data.dest = packagePath;
            data.senchaInfo = that.App.getSenchaInfo();
            if (Git.gitCloneRepo(data) !== 0) {
                fn("Failed to clone form Github...");
            } else {
                branch = Git.getBestBranch(data);
                Git.gitCheckoutBranch({path : data.dest, branch : branch});
                fn(null, packagePath); // send current path back up to trace dependencies
            }
        });
    },

    // get package info from registry
    // @@ put this in the chaki App?
    _getPackageInfo : function (opts, fn) {
        var err;
        var packageName = opts.packageName;
        var ua = this.App.getUserAgent();
        console.show("[install] 4", opts);
        // for tests we pass in module config
        if (opts.method === "test") {
            console.show("[install] 4.1", opts);
            fn(null, this.App.mockApi[packageName]);
            // @@TODO get json from TEST
        } else {
            restler.get(this.App.registryUrl + packageName, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': ua
                }
            }).on('complete', function(responseData, response) {
                if (response.statusCode == 404) {
                    err = 'Error: Package "'+packageName+'" was not found on chaki.io';
                    return fn(err);
                } else if (response.statusCode != 200 || !responseData.success) {
                    err = 'Error: Failed to load package data from chaki.io, unknown problem (HTTP status '+response.statusCode+')';
                    return fn(err);
                }
                return fn(null, responseData);
            });
        }
    },


    // Returns path with trailing slash
    _getPackageInstallPath : function (opts) {
        var path = this.App.workspacePackagesPath + '/' +opts.packageName;
        console.log("PackagePath",path);
        return path;
    },

    //
    _tracePackageDependencies : function (opts) {
        var that = this,
            trace = opts.trace || [];

        console.show("[install] 6", opts);

        if (fs.existsSync(opts.packagePath + '/package.json')) {
            var appProperties = this.App.getModuleProps(opts.packagePath + '/package.json');

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