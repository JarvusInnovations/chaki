module.exports = {

    // Loop through list of configured dependencies
    _installPackages : function (packages, workspacePackagesPath) {
        packages.forEach(function (packageName) {
            _installPackage(packageName, workspacePackagesPath, function (err) {
                if (!err) {
                    console.log("DO TRACE");
                 //   _tracePackageDependencies(packageName, workspacePackagesPath);
                }
            });
        });
    },

    // Install single package and its dependencies
    _installPackage : function (packageName, workspacePackagesPath, fn) {
        var packagePath = path.join(workspacePackagesPath, packageName);

        if (fs.existsSync(packagePath)) {
            console.log('Package already installed: ' + packageName);
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

            return fn();
        });
    }
}
