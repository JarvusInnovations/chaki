#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
    argv = require('minimist')(process.argv.slice(2)),
    chakiCommand = argv._[0],
    that,
    buildXMLPath = path.resolve(argv.app ? (argv.app + '/build.xml') : './build.xml');

var chakiApp = chakiApp || {
    registryUrl : "http://chaki.io/packages/", // API providing package registry information
    init : function (opts) {
        that = this;
        var command = opts.command || this._camelCased(argv._[0]);
        this.args = argv;
        console.log("[chaki] init - ", argv);
        if (this.commands[command]) {
            this.commands[command]();
        } else {
            console.error("Invalid command " + command);
            console.error('Usage: chaki command [package]');
        }
    },

    _getAppJsonPath : function (packagePath) {
        // if nothing is passed, use working directory
        if (!packagePath) {
            return path.resolve(argv.app ? (argv.app + '/app.json') : './app.json');
        }

        return path.resolve(packagePath);
        // otherwise, we're in a package directory looking for dependencies

    },

    _getBuildXMLPath : function (package) {

    },

    _getAppDir : function () {

    },

    commands : {
        install : function () {
            console.log("[chaki] Do install");
            var Install = require(__dirname + '/lib/install');
            Install.init({app: that});
        },

        update : function () {
            console.log("[chaki] @@TODO: Do update");
        },

        dumpAppProps : function () {
            console.log("[chaki] Do dump app props");
            var path = that._getAppJsonPath();
            console.error(JSON.stringify(that._loadAppProperties(path), null, 4));
        },

        dumpCmdProps : function () {
            console.log("[chaki] Do dump cmd props");
            console.log(JSON.stringify(that._loadCmdProperties(), null, 4));
        },

        test : function () {
            console.log("[chaki] Hello World");
        }
    },

    // @@TODO separate the appPathJson out of the logic here
    // @@TODO it should just get a path, and then return an object 
    _loadAppProperties : function (appJsonPath) {
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
        console.log(jsonObject);
        return jsonObject;
    },

    // @@TODO same as appPath above
    _loadCmdProperties : function () {
        console.error('Loading Sencha CMD configuration...');

        if (!fs.existsSync(buildXMLPath)) {
            console.error('Unable to find build.xml at ' + buildXMLPath);
            shell.exit(1);
        }

        if (!shell.which('sencha')) {
            console.error('Unable to find sencha command in path');
            shell.exit(1);
        }

        var properties = {},
            cmdOutput = shell.exec('sencha ant .props', {silent:true}).output,
            propertyRe = /\[echoproperties\]\s*([a-zA-Z0-9.\-]+)\s*=\s*([^\n]+)/g, // 
            propertyMatch;

        console.log(cmdOutput);
        while ((propertyMatch = propertyRe.exec(cmdOutput)) !== null) {
            properties[propertyMatch[1]] = propertyMatch[2];
        }

        console.error('Loaded ' + Object.keys(properties).length + ' properties.');
        return properties;
    },

    _getWorkspacePackagesPath : function (cmdProperties) {
        var path = cmdProperties['workspace.packages.dir'];

        if (!path) {
            console.error('Sencha CMD workspace does not define workspace.packages.dir');
            shell.exit(1);
        }

        if (!fs.existsSync(path)) {
            shell.mkdir('-p', path);
        }

        return path;
    },

    _camelCased : function (str) {
        if (str) {
            return  str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        }
    }

};


chakiApp.init(argv);
module.exports = chakiApp;