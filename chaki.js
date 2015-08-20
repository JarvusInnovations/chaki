/**
 * Chaki!
 **/
var flatiron = require('flatiron'),
    app = flatiron.app,
    path = require('path'),
    prettyjson = require('prettyjson').render;
    Install = require(__dirname + '/lib/install');

app.use(flatiron.plugins.cli, {
  dir: __dirname,
  usage: [
    'app is a basic flatiron cli application example!',
    '',
    'hello - say hello to somebody.'
  ]
});

app.args = app.argv;
app.cwd = path.resolve(process.cwd());


app.cmd('hello', function () {
  app.prompt.get('name', function (err, result) {
    app.log.info('hello '+result.name+'!');
  });
});

/**
 * Commands
 **/
app.cmd('install', function () {
    app.log.info('Install...');
});

app.cmd('install :package', function (package) {
    app.log.info('Installing ' + package + ' ...');
});

app.cmd('dump-cmd-props', function () {
    var path = app.getAppJsonPath();
    app.log.info(prettyjson(_loadCmdProperties()));
});

app.cmd('dump-app-props', function () {
    var path = app.getAppJsonPath();
    app.log.info(prettyjson(_loadAppProperties(path)));
});

// /**
//  * GETTERS
//  **/
app.getAppJsonPath = function (packagePath) {
    var path;
    if (packagePath) {
        path = packagePath + '/package.json';
    } else {
        path = (app.args.app)  ? app.args.app + '/app.json' : app.cwd + '/app.json';
    }

    console.log("[chaki] getAppJson", path);
    return path;
};

app.getSenchaInfo = function () {
    var data = app._loadCmdProperties(['app.framework.version', "app.framework"]);
    return data;
};

app.getCmdProps = function (props) {
    return app._loadCmdProperties(props);
};

app.getAppProps = function (props) {
    console.log(props);
    var path = app.getAppJsonPath();
    return app._loadAppProperties(path, props);
};

// /**
//  * PRIVATES
//  **/
_getBuildXMLPath = function () {
    return (app.args.app) ? path.resolve(__dirname, app.args.app, './build.xml') : path.resolve(path.resolve(process.cwd()), './build.xml');
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
    var buildXMLPath = _getBuildXMLPath(),
        that = app;

    // check first for locally stored values
    if (app.cmdProperties) {
        return (props) ? _.pick(app.cmdProperties, props) : app.cmdProperties;
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

    if (app.args.app) {
        shell.cd(app.args.app);
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
        app.cmdProperties = properties;
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

app.start();