#!/usr/bin/env node

var fs = require('fs'),
	path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
	argv = require('minimist')(process.argv.slice(2)),
	chakiCommand = argv._[0],
	appJsonPath = argv._[1] || 'app.json',
	appDir = path.dirname(appJsonPath),
	appJson,
	packagesPath;



// load app.json into string
appJson = fs.readFileSync(appJsonPath, {encoding: 'utf8'});

// strip comments
appJson = appJson.replace(/\/\*[\s\S]*?\*\//g, '');

// correct escaping ("\."" -> "\\."")
appJson = appJson.replace(/([^\\])\\\./g, '$1\\\\.');

// parse JSON
appJson = JSON.parse(appJson);

// detect packages directory relative to app.json
packagesPath = path.join(appDir, 'packages');
if (!fs.existsSync(packagesPath)) {
	// try going up one directory to workspace
	packagesPath = path.join(appDir, '..', 'packages');
}

if (!fs.existsSync(packagesPath)) {
	throw 'Could not find packages directory';
}



// process command
if (chakiCommand == 'install') {
	// TODO: crawl package sub-dependencies
	// TODO: deal with framework/version branches

	// install packages
	appJson.requires.forEach(function(packageName) {
		var packagePath = path.join(packagesPath, packageName);

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
} else if (chakiCommand == 'update') {
	console.log('TODO: update packages');
} else {
	console.error('Usage: chaki install');
}