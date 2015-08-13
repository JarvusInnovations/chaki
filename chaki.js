#!/usr/bin/env node
var fs = require('fs'),
    path = require('path'),
    restler = require('restler'),
    shell = require('shelljs'),
    argv = require('minimist')(process.argv.slice(2)),
    chakiCommand = argv._[0],
    _ = require('underscore'),
    that;

var chakiApp = chakiApp || {
    registryUrl : "http://chaki.io/packages/", // API providing package registry information
    init : function (opts) {
        that = this;
        var command = opts.command || this._camelCased(argv._[0]);
        this.args = opts.args || argv;
        _.extend(this, opts);
        console.error("[chaki] init - ", argv);
        if (this.commands[command]) {
            this.commands[command](opts);
        } else {
            console.error("Invalid command " + command);
            console.error('Usage: chaki command [package]');
        }
    },

    _getAppJsonPath : function (packagePath) {
        var outPath;
        // if nothing is passed, use working directory
        if (!packagePath) {
            outPath = path.resolve(this.args.app ? (this.args.app + '/app.json') : './app.json');
        } else {  // otherwise, we're in a package directory looking for dependencies
            outPath = path.resolve(packagePath);
        }

        console.error("_getAppJsonPath", outPath);
        return outPath;
    },

    _getBuildXMLPath : function (packagePath) {
        var outPath;
        // if nothing is passed, use working directory
        if (!packagePath) {
            outPath = path.resolve(this.args.app ? (this.args.app + '/build.xml') : './build.xml');
        } else { // otherwise, we're in a package directory looking for dependencies
            outPath = path.resolve(packagePath);
        }
        console.error("_getBuildXMLPath", outPath);
        return outPath;
    },

    _getAppDir : function () {

    },

    commands : {
        install : function (opts) {
            console.error("[chaki] Do install");
            var Install = require(__dirname + '/lib/install');
            Install.installPackages({app: that, method : opts.method});
        },

        update : function () {
            console.error("[chaki] @@TODO: Do update");
        },

        dumpAppProps : function () {
            console.error("[chaki] Do dump app props");
            var path = that._getAppJsonPath();
            console.error(JSON.stringify(that._loadAppProperties(path), null, 4));
        },

        dumpCmdProps : function () {
            console.error("[chaki] Do dump cmd props");
            console.error(JSON.stringify(that._loadCmdProperties(), null, 4));
        },

        test : function () {
            console.error("[chaki] Hello World");
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
        console.error(jsonObject);
        return jsonObject;
    },

    // @@TODO same as appPath above
    _loadCmdProperties : function (buildXMLPath) {
        console.error('Loading Sencha CMD configuration...');
        var buildXMLPath = this._getBuildXMLPath(buildXMLPath);

        if (!fs.existsSync(buildXMLPath)) {
            console.error('Unable to find build.xml at ' + buildXMLPath);
            shell.exit(1);
        }

        if (!shell.which('sencha')) {
            console.error('Unable to find sencha command in path');
            shell.exit(1);
        }
        shell.cd(this.args.app);
        var properties = {},
            cmdOutput = shell.exec('sencha ant .props', {silent:true}).output,
            propertyRe = /\[echoproperties\]\s*([a-zA-Z0-9.\-]+)\s*=\s*([^\n]+)/g, // 
            propertyMatch;

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