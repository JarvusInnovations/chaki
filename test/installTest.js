var chaki = require('../chaki'),
    path = require('path'),
    shell = require('shelljs'),
    rmdir = require('rimraf'),
    fs = require('fs'),
    testModulePath = 'test/testApp/sencha-workspace/SlateAdmin/',
    testGitRepo = "starsinmypockets";

// quick mock of API
// module A depends on module B
//   not listed
var mockApi = {
    moduleA :  {
        data : 
            { ID: 20,
              Class: 'Chaki\\Package',
              Created: 1433185986,
              CreatorID: 5,
              Handle: 'chaki-test-module-A',
              GitHubPath: testGitRepo + '/chaki-test-module-A',
              Description: null,
              README: null 
            }
    },
    moduleB : {
        data : 
            { ID: 20,
              Class: 'Chaki\\Package',
              Created: 1433185986,
              CreatorID: 5,
              Handle: 'chaki-test-module-B',
              GitHubPath: testGitRepo + '/chaki-test-module-B',
              Description: null,
              README: null 
            }
        }

};

var testChakiRuns = function (test) {
    console.error("TEST 1");
    chaki.init({
        command : 'test',
        args : {}
    });
    test.ok(1 === 1);
    test.done();
};

var testGetAppJsonPath = function (test) {
    console.error("TEST 2");
    var jsonPath = chaki._getAppJsonPath();
    test.ok(jsonPath === path.resolve(__dirname, '..', 'app.json'), "_getAppJsonPath should be the same as the chaki path");
    test.ok(chaki._getAppJsonPath('ext/123') === path.resolve(__dirname, '..', 'ext', '123'));
    test.done();
};

// givn path to a bujild.xml, this should kick out properties from sencha
var testGetBuildXML = function (test) {
    console.error("TEST 5");
    test.expect(3);
    chaki.args.app = testModulePath;
    var cmds = chaki._loadCmdProperties();
    var workspaceDir = cmds['workspace.packages.dir'];
    test.ok(typeof cmds === 'object');
    test.ok(typeof workspaceDir === "string");
    test.ok(workspaceDir.split('/').length > 0);
    test.done();
};

var testGetWorkspacePackagePath = function (test) {
    console.error("TEST 3", __dirname);
    chaki._getWorkspacePackagesPath();
    test.done();
};

var testInstall = function (test) {
        var pkgDir = 'testApp/sencha-workspace/packages/';
        var pkgPath = path.resolve(__dirname, pkgDir);
        test.expect(1);
        // remove old packages from test app packageDir
        rmdir(pkgPath, function () {
            // put it back
            fs.mkdirSync(pkgPath);
            console.log("111");
            chaki.init({
                command : "install",
                method : "test",
                mockApi : mockApi,
                args : {
                    app : 'test/testApp/sencha-workspace/SlateAdmin/'
                }
            });
        });
};


// module.exports.testChakiRuns = testChakiRuns;
// module.exports.testGetAppJsonPath = testGetAppJsonPath;
// module.exports.testGetWorkspacePackagePath = testGetWorkspacePackagePath;
module.exports.testGetBuildXML = testGetBuildXML;
//module.exports.testInstall = testInstall;