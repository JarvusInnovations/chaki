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

    // cache some stuff
    _cache : {},

    _getAppJsonPath : function (packagePath) {
        var outPath;
        console.log("[app] _getAppJsonPath", packagePath, this.args.app);
        // if nothing is passed, use working directory
        if (!packagePath) {
            outPath = (this.args.app) ? path.resolve(__dirname, this.args.app, 'app.json') : path.resolve(this.curPath, './app.json');
        } else {  // otherwise, we're in a package directory looking for dependencies
            outPath = path.resolve(packagePath);
        }

        console.error("_getAppJsonPath", outPath);
        return outPath;
    },

    getAppJsonPath : function (packagePath) {
        var path;
        if (packagePath) {
            path = packagePath + '/package.json';
        } else {
            path = (this.args.app)  ? this.args.app + '/app.json' : __dirname + '/app.json';
        }

        console.log("[chaki] getAppJson", path);
        return path;
    },

    _getBuildXMLPath : function (componentPath) {
        console.error("[chaki] _getBuildXMLPath", componentPath, this.args.app);
        var outPath;
        
        if (!componentPath) {
            outPath = (this.args.app) ? path.resolve(__dirname, this.args.app, './build.xml') : path.resolve(path.resolve(process.cwd()), './build.xml');
        } else { 
            outPath = path.resolve(componentPath) + '/build.xml';
        }
        
        return outPath;
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

    // @@TODO cache this stuff in memory
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

    // @@TODO cache this stuff in memory
    _loadCmdProperties : function (componentPath, props) {
        console.error('Loading Sencha CMD configuration...');
        var buildXMLPath = this._getBuildXMLPath(componentPath),
            that = this;

        // check first for locally stored values
        if (this.cmdProperties) {
            console.log('[chaki] Serving stored values');
            return this.cmdProperties;
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

    getWorkspacePackagesPath : function (opts) {
        console.error('[App] gwspp 1', opts);
        var workspacePath = __dirname + '';
        if (opts.parents) {
            _.each(opts.parents, function (parent) {
                path = path.concat(parent + '/packages/');
            });
        }

        console.error('[App] gwspp 1', path.resolve(workspacePath));

        return path.resolve(workspacePath);
        // get dependencies base directory
        // for each 
    },
    
    //
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

    getSenchaInfo : function () {
        var data = this._loadCmdProperties(null, ['app.framework.version', "app.framework"]);
        return data;
    },
    
    _camelCased : function (str) {
        if (str) {
            return  str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        }
    }

};


chakiApp.init(argv);
module.exports = chakiApp;