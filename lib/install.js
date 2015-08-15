var path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
    fs = require('fs'),
    _ = require('underscore');

module.exports = {
    installPackages : function (opts) {
        console.log('[install] 1', opts);
        this.App = opts.app;

        var requestedPackage = this.App.args[1],
            method = opts.method || 'api';

        // @@TODO check for requested package 
        this._installPackages({method : method}, function (err) {
            if (err) {
                console.error(err);
                return;
            }
            console.error("Package installation complete!");
        });
    },

    // Loop through list of configured dependencies
    _installPackages : function (opts) {
        console.log('[install] 2', opts);
        console.log('[install] 2.T', opts.trace);
        // setup state for current level
        // if opts.path is null, we get the args.app value, or just the script execute path
        var jsonPath;

        if (opts.path) jsonPath = opts.path.concat('/app.json');
        console.log('[install] 2.01', jsonPath);
        var data = {},
            appJsonPath = this.App._getAppJsonPath(jsonPath), 
            that = this;
        data.appConfig = opts.appConfig || this.App._loadAppProperties(appJsonPath);
        data.method = opts.method || "api";
        data.packages = opts.requestedPackage ? [requestedPackage] : data.appConfig.requires;
        data.trace = opts.trace || [];

        console.log('[install] 2.1', data);
        // check if 
        if (!fs.existsSync(this.App.workspacePackagesPath)) {
            fs.mkdirSync(this.App.workspacePackagesPath);
        }

        _.each(data.packages, function (packageName) {
            console.log('[install] 2.2', packageName);
//            data.parents.push(packageName);
            data.packageName = packageName;
            data.trace.push(packageName);
            that._installPackage(data, function (err, path) {
                if (!err) {
                    console.error("DO TRACE", path);
                    that._tracePackageDependencies({
                        packagePath : path,
                        method : data.method,
                        trace : data.trace
                    });
                } else {
                    console.error(err);
                }
            });
        });
    },

    // Install single package and trace dependencies
    _installPackage : function (opts, fn) {
        console.log('[install] 3', opts);
        var err,
            packagePath = this.App.workspacePackagesPath + '/' + opts.packageName;

        if (fs.existsSync(packagePath)) {
            err = 'Package already installed: ' + opts.packageName;
            console.log('[install 3.1]', err);
            return fn({err : err});
        }

        this._getPackageInfo(opts, function (err, packageInfo) {
            console.log("_gP1", err, packageInfo);

            if (err) return fn({err : err});

            // If all is well, go get the package from github
            if (shell.exec('git clone https://github.com/'+packageInfo.data.GitHubPath+'.git ' + packagePath).code !== 0) {
                console.error('Error: failed to clone from GitHub');
                return fn({error : true});
            } else {
                return fn(null, packagePath); // send current path back up to trace dependencies
            }
        });
    },

    _getPackageInfo : function (opts, fn) {
        var err;
        var packageName = opts.packageName;

        console.log("[install] 4", opts);
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

    //
    _tracePackageDependencies : function (opts, fn) {
        var that = this;
        console.error("[install] 5", opts);
        if (fs.existsSync(opts.packagePath + '/app.json')) {
            var appProperties = this.App._loadAppProperties(opts.packagePath + '/app.json');
            console.log(appProperties.requires);
            // if there are children, recurse
            if (appProperties && appProperties.requires && appProperties.requires.length > 0) {
                console.log('[install 5.1]');
                that._installPackages({path : opts.packagePath, 
                                       method : opts.method,
                                       trace : opts.trace
                                    });
            }
        }
    },

    // checkout the required version of the package
    _gitCheckoutVersion : function () {
        // @@TODO stub for branch checkout handling
    }
};