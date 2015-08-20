/**
 * Chaki!
 **/

var flatiron = require('flatiron'),
    path = require('path'),
    cli = flatiron.app,
    Install = require(__dirname + '/lib/install');


cli.use(flatiron.plugins.cli, {
  dir: __dirname,
  usage: [
    'Chaki install [packagename]'
  ]
});

cli.cmd('hello', function () {
  cli.prompt.get('name', function (err, result) {
    cli.log.info('hello '+result.name+'!');
  });
});

cli.cmd('install', function () {
    cli.log.info('Install...');
});

cli.cmd('install :hey', function (package) {
    cli.log.info('Installing ' + package + ' ...');
});

cli.cmd('dump-cmd-props', function () {

});

cli.cmd('dump-app-props', function () {

});

/**
 * GETTERS
 **/
getAppJsonPath = function (packagePath) {
    var path;
    if (packagePath) {
        path = packagePath + '/package.json';
    } else {
        path = (this.args.app)  ? this.args.app + '/app.json' : this.curPath + '/app.json';
    }

    console.log("[chaki] getAppJson", path);
    return path;
};

getSenchaInfo = function () {
    var data = this._loadCmdProperties(['app.framework.version', "app.framework"]);
    return data;
};

getCmdProps = function (props) {
    return this._loadCmdProperties(props);
};

getAppProps = function (props) {
    console.log(props);
    var path = this.getAppJsonPath();
    return this._loadAppProperties(path, props);
};

/**
 * PRIVATES
 **/
_getBuildXMLPath = function () {
    return (this.args.app) ? path.resolve(__dirname, this.args.app, './build.xml') : path.resolve(path.resolve(process.cwd()), './build.xml');
};

_loadAppProperties = function (appJsonPath, props) {

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

    if (props) {
        return _.pick(jsonObject, props);
    }

    console.error('Loaded ' + Object.keys(jsonObject).length + ' properties.');
    return jsonObject;
};

_loadCmdProperties = function (props) {
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
};

_getWorkspacePackagesPath = function (cmdProperties) {
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
};

/**
 * Util
 **/
_camelCased = function (str) {
    if (str) {
        return  str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    }
};

cli.start();