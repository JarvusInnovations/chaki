    var path = require('path'),
        restler = require('restler'),
        shell = require('shelljs'),
        fs = require('fs');

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
            return;
        });
    },

    // Loop through list of configured dependencies
    _installPackages : function (opts) {
        console.log('[install] 2', opts);
        // setup state for current level
        // if opts.path is null, we get the args.app value, or just the script execute path
        var data = {},
            appJsonPath = this.App._getAppJsonPath(opts.path), 
            cmdProperties = this.App._loadCmdProperties(opts.path),
            that = this;

        data.appConfig = opts.appConfig || this.App._loadAppProperties(appJsonPath),
        data.method = opts.method || "api",
        data.workspacePackagesPath = this.App._getWorkspacePackagesPath(cmdProperties);
        data.packages = opts.requestedPackage ? [requestedPackage] : data.appConfig.requires;

        // @@check if workspacePackagesPath exists and create if not
        if (!fs.existsSync(data.workspacePackagesPath)) {
            fs.mkdirSync(data.workspacePackagesPath);
        }

        data.packages.forEach(function (packageName) {
            data.packageName = packageName;
            that._installPackage(data, function (err, path) {
                if (!err) {
                    console.error("DO TRACE", path);
                    that._tracePackageDependencies({packagePath : path, method : data.method });
                } else {
                    console.error(err);
                }
            });
        });
    },

    // Install single package and trace dependencies
    _installPackage : function (opts, fn) {
        console.log('[install] 3', opts);
        var packagePath = path.resolve(opts.workspacePackagesPath, opts.packageName),
            data = opts,
            err;

        data.packagePath = packagePath;
        console.log('[install] 3.1', packagePath);

        if (fs.existsSync(packagePath)) {
            err = 'Package already installed: ' + opts.packageName;
            return fn({err : err});
        }

        this._getPackageInfo(opts, function (err, packageInfo) {
            console.log("_gP1", err, packageInfo);

            if (err) return fn({err : err});

            // If all is well, go get the package from github
            if (shell.exec('git clone https://github.com/'+packageInfo.data.GitHubPath+'.git ' + opts.packagePath).code !== 0) {
                console.error('Error: failed to clone from GitHub');
                return fn({error : true});
            }

            fn(null, packagePath); // send current path back up to trace dependencies
        });
    },

    _getPackageInfo : function (opts, fn) {
        console.log("[install] 4", opts);
        var packageName = opts.packageName;
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
                    console.error('Error: Package "'+packageName+'" was not found on chaki.io');
                    return fn({err : true});
                } else if (response.statusCode != 200 || !responseData.success) {
                    console.error('Error: Failed to load package data from chaki.io, unknown problem (HTTP status '+response.statusCode+')');
                    return fn({err : true});
                }
                return fn(null, responseData);
            });
        }
    },

    //
    _tracePackageDependencies : function (opts) {
        console.error("[install] 5", opts);
        var appProperties = this.App._loadAppProperties(opts.packagePath + '/app.json');
        console.log(appProperties);

        // if there are children, recurse
        if (appProperties && appProperties.requires && appProperties.requires.length > 0) {
            this._installPackages({path : opts.packagePath, method : method});
        }
    },

    // checkout the required version of the package
    _gitCheckoutVersion : function () {
        // @@TODO stub for branch checkout handling
    }
};