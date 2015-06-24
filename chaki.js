#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
    argv = require('minimist')(process.argv.slice(2)),
    chakiCommand = argv._[0],
    appJsonPath = path.resolve(argv.app ? (argv.app + '/app.json') : './app.json'),
    appDir = path.dirname(appJsonPath);


if (chakiCommand == 'install') {
    _executeInstall();
} else if (chakiCommand == 'update') {
    _executeUpdate();
} else if (chakiCommand == 'dump-app-props') {
    _executeDumpAppProps();
} else if (chakiCommand == 'dump-cmd-props') {
    _executeDumpCmdProps();
} else {
    console.error('Usage: chaki install');
}











// LIBRARY (TODO: move to external file)
function _loadAppProperties() {
    console.error('Loading app configuration from ' + appJsonPath + '...');

    if (!fs.existsSync(appJsonPath)) {
        console.error('Unable to find app.json at ' + appJsonPath);
        shell.exit(1);
    }

    var jsonString = fs.readFileSync(appJsonPath, {encoding: 'utf8'});

    // strip comments
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');

    // correct escaping ("\."" -> "\\."")
    jsonString = jsonString.replace(/([^\\])\\\./g, '$1\\\\.');

    var jsonObject = JSON.parse(jsonString);

    console.error('Loaded ' + Object.keys(jsonObject).length + ' properties.');

    return jsonObject;
}


function _loadCmdProperties() {
    console.error('Loading Sencha CMD configuration...');

    if (!shell.which('sencha')) {
        console.error('Unable to find sencha command in path');
        shell.exit(1);
    }

    var properties = {},
        cmdOutput = shell.exec('sencha ant .props', {silent:true}).output,
        propertyRe = /\[echoproperties\]\s*([a-zA-Z0-9.\-]+)\s*=\s*([^\n]+)/g, // 
        propertyMatch;

    while ((propertyMatch = propertyRe.exec(cmdOutput)) !== null) {
        properties[propertyMatch[1]] = propertyMatch[2];
    }

    console.error('Loaded ' + Object.keys(properties).length + ' properties.');

    return properties;
}


function _getWorkspacePackagesPath(cmdProperties) {
    var path = cmdProperties['workspace.packages.dir'];

    if (!path) {
        console.error('Sencha CMD workspace does not define workspace.packages.dir');
        shell.exit(1);
    }

    if (!fs.existsSync(path)) {
        shell.mkdir('-p', path);
    }

    return path;
}


function _executeInstall() {
    var appConfig = _loadAppProperties(),
        cmdProperties = _loadCmdProperties(),
        workspacePackagesPath = _getWorkspacePackagesPath(cmdProperties);

    // TODO: crawl package sub-dependencies
    // TODO: deal with framework/version branches

    // install packages
    appConfig.requires.forEach(function(packageName) {
        var packagePath = path.join(workspacePackagesPath, packageName);

        if (fs.existsSync(packagePath)) {
            console.log('Package already installed: ' + packageName);
            return;
        }

        console.log('Fetching package: ' + packageName);
        restler.get('http://chaki.io/packages/' + packageName, {
            headers: {
                Accept: 'application/json'
            }
        }).on('complete', function(responseData, response) {
            if (response.statusCode == 404) {
                console.error('Error: Package "'+packageName+'" was not found on chaki.io');
                return;
            } else if (response.statusCode != 200 || !responseData.success) {
                console.error('Error: Failed to load package data from chaki.io, unknown problem (HTTP status '+response.statusCode+')');
                return;
            }

            if (shell.exec('git clone https://github.com/'+responseData.data.GitHubPath+'.git ' + packagePath).code !== 0) {
                console.error('Error: failed to clone from GitHub');
            }
        });
    });
}


function _executeUpdate() {
    console.log('TODO: update packages');
}


function _executeDumpAppProps() {
    console.log(JSON.stringify(_loadAppProperties(), null, 4));
}


function _executeDumpCmdProps() {
    console.log(JSON.stringify(_loadCmdProperties(), null, 4));
}