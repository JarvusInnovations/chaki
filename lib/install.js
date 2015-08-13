    var path = require('path'),
        restler = require('restler'),
        shell = require('shelljs'),
        fs = require('fs');

module.exports = {
    init : function (opts) {
        this.App = opts.app;

        var appJsonPath = this.App._getAppJsonPath(),
            appConfig = opts.appConfig || this.App._loadAppProperties(appJsonPath),
            cmdProperties = this.App._loadCmdProperties(),
            requestedPackage = this.App.args._[1],
            packages = requestedPackage ? [requestedPackage] : appConfig.requires;
        
        this.workspacePackagesPath = this.App._getWorkspacePackagesPath(cmdProperties);
        this._installPackages(packages);

    },

    // Loop through list of configured dependencies
    _installPackages : function (packages, method) {
        method = method || "api";
        var that = this;
        packages.forEach(function (packageName) {
            that._installPackage(packageName, method, function (err, drill) {
                if (!err) {
                    console.log("DO TRACE", drill);
                    that._tracePackageDependencies(drill);
                } else {
                    console.error(err);
                }
            });
        });
    },

    // Install single package and trace dependencies
    _installPackage : function (packageName, method, fn) {
        var packagePath = path.join(this.workspacePackagesPath, packageName);

        if (fs.existsSync(packagePath)) {
            console.error('Package already installed: ' + packageName);
            return fn({err : true});
        }

        this._getPackageInfo(packageName, method, function (err, pkgInfo) {
            if (err) return fn({err : err});

            // If all is well, go get the package from github
            if (shell.exec('git clone https://github.com/'+responseData.data.GitHubPath+'.git ' + packagePath).code !== 0) {
                console.error('Error: failed to clone from GitHub');
                return fn({error : true});
            }

            return fn(null, packagePath);
        });
    },

    _getPackageInfo : function (packageName, method, fn) {
        // for tests we pass in module config
        if (method === "test") {
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
                return fn(null, packagePath);
            });
        }
    },

    // checkout the required version of the package
    _gitCheckoutVersion : function () {
        // @@TODO stub for branch checkout handling
    },

    //
    _tracePackageDependencies : function (packagePath) {
        console.log("PKG-PATH", packagePath);
        // get configItems
        // check for deps
        // if deps
            // this._installPackages(packages)
    }
};