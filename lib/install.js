    var path = require('path'),
        restler = require('restler'),
        shell = require('shelljs'),
        fs = require('fs');

module.exports = {
    init : function (App) {
        var appJsonPath = App._getAppJsonPath(),
            appConfig = App._loadAppProperties(appJsonPath),
            cmdProperties = App._loadCmdProperties(),
            requestedPackage = App.args._[1],
            packages = requestedPackage ? [requestedPackage] : appConfig.requires;


        // TODO: crawl package sub-dependencies
        // TODO: deal with framework/version branches

        // install packages
        this.workspacePackagesPath = App._getWorkspacePackagesPath(cmdProperties);
        this._installPackages(packages);

    },

    // Loop through list of configured dependencies
    _installPackages : function (packages) {
        var that = this;
        packages.forEach(function (packageName) {
            that._installPackage(packageName, function (err, drill) {
                if (!err) {
                    console.log("DO TRACE", drill);
                    that._tracePackageDependencies(drill);
                }
            });
        });
    },

    // Install single package and its dependencies
    _installPackage : function (packageName, fn) {
        var packagePath = path.join(this.workspacePackagesPath, packageName);

        if (fs.existsSync(packagePath)) {
            console.error('Package already installed: ' + packageName);
            return fn({err : true});
        }

        console.log('Fetching package: ' + packageName);
        restler.get('http://chaki.io/packages/' + packageName, {
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

            console.log("[chaki] ", packageName);
            console.log("[chaki] ", responseData.data);

            if (shell.exec('git clone https://github.com/'+responseData.data.GitHubPath+'.git ' + packagePath).code !== 0) {
                console.error('Error: failed to clone from GitHub');
                return fn({error : true});
            }

            return fn(null, packagePath);
        });
    },

    // checkout the required version of the package
    _gitCheckoutVersion : function () {

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