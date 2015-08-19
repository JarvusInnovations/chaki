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
    depDirMode : 0755, // @@TODO what file mode we want here?

    init : function (opts) {
        that = this;
        this.args = opts.args || argv;
        this.curPath = path.resolve(process.cwd());

        var command = opts.command || this._camelCased(argv._[0]);

        _.extend(this, opts);
        console.error("[chaki] init - ", this.args);
        console.error("[chaki] init - 1", path.resolve(process.cwd()));
        if (this.commands[command]) {
            this.commands[command](opts);
        } else {
            console.error("Invalid command " + command);
            console.error('Usage: chaki command [package]');
        }
    },

    commands : {
        install : function (opts) {
            console.error("[chaki] Do install");
            var cmdProperties = that._loadCmdProperties();
            var Install = require(__dirname + '/lib/install');
            that.workspacePackagesPath = that._getWorkspacePackagesPath(cmdProperties);
            console.error("A-in-1", that.workspacePackagesPath);
            Install.installPackages({app: that, method : opts.method});
        },

        update : function () {
            console.error("[chaki] @@TODO: Do update");
        },

        dumpAppProps : function () {
            console.error("[chaki] Do dump app props");
            var path = that.getAppJsonPath();
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

    /**
     * GETTERS
     **/
    getAppJsonPath : function (packagePath) {
        var path;
        if (packagePath) {
            path = packagePath + '/package.json';
        } else {
            path = (this.args.app)  ? this.args.app + '/app.json' : this.curPath + '/app.json';
        }

        console.log("[chaki] getAppJson", path);
        return path;
    },

    getSenchaInfo : function () {
        var data = this._loadCmdProperties(null, ['app.framework.version', "app.framework"]);
        return data;
    },
    
    /**
     * PRIVATES
     **/
    _getBuildXMLPath : function () {
        return (this.args.app) ? path.resolve(__dirname, this.args.app, './build.xml') : path.resolve(path.resolve(process.cwd()), './build.xml');
    },

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
        return jsonObject;
    },

    _loadCmdProperties : function (props) {
        console.error('Loading Sencha CMD configuration...');
        var buildXMLPath = this._getBuildXMLPath(),
            that = this;

        // check first for locally stored values
        if (this.cmdProperties) {
            return (props) ? _.pick(this.cmdProperties, props) : this.cmdProperties;
        }

        // or recompute....
        if (!fs.existsSync(buildXMLPath)) {
            console.error('Unable to find build.xml at ' + buildXMLPath);
            shell.exit(1);
        }

        if (!shell.which('sencha')) {
            console.error('Unable to find sencha command in path');
            shell.exit(1);
        }

        if (this.args.app) {
            shell.cd(this.args.app);
        }


        // try to recover gracefully if there's an issue with sencha cmd
        try {
            var properties = {},
                cmdOutput = shell.exec('sencha ant .props', {silent:true}).output,
                propertyRe = /\[echoproperties\]\s*([a-zA-Z0-9.\-]+)\s*=\s*([^\n]+)/g, // 
                propertyMatch;

            while ((propertyMatch = propertyRe.exec(cmdOutput)) !== null) {
                properties[propertyMatch[1]] = propertyMatch[2];
            }

            console.error('Loaded ' + Object.keys(properties).length + ' properties.');
            
            if (props) {
                return _.pick(properties, props);
            }

            // save values to app object
            this.cmdProperties = properties;
            return properties;
        } catch (e) {
            console.error("Error loading Sencha Cmd", e);
            return {};
        }
    },

    _getWorkspacePackagesPath : function (cmdProperties) {
        var path = cmdProperties['workspace.packages.dir'];
        console.error("_workspacePath", path);
        if (!path) {
            console.error('Sencha CMD workspace does not define workspace.packages.dir');
            shell.exit(1);
        }

        if (!fs.existsSync(path)) {
            shell.mkdir('-p', path);
        }

        return path;
    },

    /**
     * Util
     **/
    _camelCased : function (str) {
        if (str) {
            return  str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        }
    }
};


chakiApp.init(argv);
module.exports = chakiApp;