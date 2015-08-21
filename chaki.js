/**
 * Chaki!
 **/
var flatiron = require('flatiron'),
    app = flatiron.app,
    path = require('path'),
    prettyjson = require('prettyjson').render;
    Install = require(__dirname + '/lib/install'),
    xml2js = require('xml2js'),
    _ = require('underscore'),
    strip = require('strip-comments');

console.json = function(json) {
    app.log.info(prettyjson(JSON.stringify(json, 100)));
};

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
app.registryUrl = 'htpps://chaki.io/packages/';

app.extend = function (opts) {
    _.extend(app, opts);
};

/**
 * Commands
 **/

app.cmd('hello', function () {
  app.prompt.get('name', function (err, result) {
    app.log.info('hello '+result.name+'!');
  });
});

app.cmd('install', function () {
    app.log.info('Install...');
    var cmdProperties = _loadCmdProperties();
    var Install = require(__dirname + '/lib/install');
    app.workspacePackagesPath = _getWorkspacePackagesPath(cmdProperties);
    Install.installPackages({app: app, method : 'api'});
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

app.cmd('get-ua-string', function () {
    app.log.info(app.getUserAgent());
});

/**
 * GETTERS
 **/
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

app.getNpmData = function (props) {
    var data = require(path.resolve(__dirname, 'package.json'));
    
    if (props) {
        return _.pick(data, props);
    }

    return data;
};

app.getUserAgent = function () {
    var ver = app.getNpmData('version').version;
    var sen = app.getSenchaInfo();
    var hash = sha1(sen['app.framework.version']);
    var ua = "Chaki/"+ver+" ("+ sen['app.framework']+'/'+sen['app.framework.version']+'; app/'+hash+')';
    return(ua);
};

app.getSenchaInfo = function () {
    var data = app.getCmdProps(['app.framework.version', "app.framework"]);
    return data;
};

app.getCmdProps = function (props) {
    return _loadCmdProperties(props);
};

app.getAppProps = function (props) {
    console.log(props);
    var path = app.getAppJsonPath();
    return _loadAppProperties(path, props);
};

app.getModuleProps = function (path, props) {
    return _loadAppProperties(path, props);
};

// get requires array from app.json
app.getAppJsonRequires = function (appJson) {
    var regex = /"requires"\s*:\s*\[([^\]\*]+)\]/;
    var match = (appJson.match(regex))[0];
    console.log("getAppJsonRequires", match);
    return match;
},

/**
 * SETTERS
 **/

// here this one will give you an additional match set that gives you what you should prefix 
// your addition with to indent consistently:
// /"requires"\s*:\s*\[(\s*)([^\]\*]+)\]/
// so glue `,$1”packgae-name”` to the end of $2

// make sure there's 1 and only 1 match
// append package name
// replace
// write
app.updateAppJson = function (opts) {
    var regex = /"requires"\s*:\s*\[([^\]\*]+)\]/;
    var appJson = fs.readFileSync(app.getAppJsonPath(), 'utf8');
    var match = app.getAppJsonRequires(appJson);
    var update = match.substring(0, match.length - 2);
    update += ', \"' + opts.packageName + '\"]';
    appJson = appJson.replace(regex, update);

    // make sure we're left with a valid json obj
    if (app.checkUpdateAppJson(appJson)) {
        fs.writeFileSync(app.getAppJsonPath(), appJson);
        return true;
    } else {
        console.error("There was a problem updating the app.json configuration\
            file. You might want to update it manually to reflect the module you\
            just installed.");
        return false;
    }
    console.log("UAJ1", opts, match, update, appJson);    
};

// ensure that when stripped of comments that
// this is valid JSON
app.checkUpdateAppJson = function (appJson) {
    try {
        JSON.stringify(strip(appJson)); 
        return true;  
    } catch (e) {
        console.log("CATCH");
        return false;
    }
};


// <target name=“-before-build”>
//     <exec executable=“chaki”>
//         <arg value=“update” />
//     </exec>
// </target>

//insert it before `</project>`

app.addTargetHook = function () {
    var parser = new xml2js.Parser();
    var xml = fs.readFileSync(_getBuildXMLPath(), 'utf8');
    var obj = xml2js.parseString(xml, function (err, result) {
        console.json(result);
    });
};

/**
 * PRIVATES
 **/
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

sha1 = function (input) {
    var crypto = require('crypto');
    return crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex');
};

getPosition = function(str, m, i) {
   return str.split(m, i).join(m).length;
};

// let's use words ;[]
String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

module.exports = app;
app.start();
