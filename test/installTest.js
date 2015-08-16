var chaki = require('../chaki'),
    path = require('path'),
    shell = require('shelljs'),
    rmdir = require('rimraf'),
    fs = require('fs'),
    testModulePath = 'test/testApp/sencha-workspace/SlateAdmin/',
    testGitRepo = "starsinmypockets";

// snitch on uncaught exceptions please
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

/**
 * Mock up API returns
 *
 * @@TODO Project structure is as follows:
 *
 * APP
 * ├─┬ chaki-test-module-A
 * │ ├── chaki-test-module-A-1
 * │ └── chaki-test-module-A-2
 * └─┬ chaki-test-module-B
 *   └──┬ chaki-test-module-B-1
 *      ├── chaki-test-module-B-1-a
 *      └── chaki-test-module-B-1-b   
 */
var mockApi = {
    'chaki-test-module-A' :  {
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
    'chaki-test-module-B' : {
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
      },
    'chaki-test-module-A-1' : {
        data : 
            { ID: 20,
              Class: 'Chaki\\Package',
              Created: 1433185986,
              CreatorID: 5,
              Handle: 'chaki-test-module-A-1',
              GitHubPath: testGitRepo + '/chaki-test-module-A-1',
              Description: null,
              README: null 
            }
      },
    'chaki-test-module-A-2' : {
        data : 
            { ID: 20,
              Class: 'Chaki\\Package',
              Created: 1433185986,
              CreatorID: 5,
              Handle: 'chaki-test-module-A-2',
              GitHubPath: testGitRepo + '/chaki-test-module-A-2',
              Description: null,
              README: null 
            }
      },
    'chaki-test-module-B-1' : {
        data : 
            { ID: 20,
              Class: 'Chaki\\Package',
              Created: 1433185986,
              CreatorID: 5,
              Handle: 'chaki-test-module-N-1',
              GitHubPath: testGitRepo + '/chaki-test-module-B-1',
              Description: null,
              README: null 
            }
      },
    'chaki-test-module-B-1-a' : {
        data : 
            { ID: 20,
              Class: 'Chaki\\Package',
              Created: 1433185986,
              CreatorID: 5,
              Handle: 'chaki-test-module-B-1-a',
              GitHubPath: testGitRepo + '/chaki-test-module-B-1-a',
              Description: null,
              README: null 
            }
      },
    'chaki-test-module-B-1-b' : {
        data : 
            { ID: 20,
              Class: 'Chaki\\Package',
              Created: 1433185986,
              CreatorID: 5,
              Handle: 'chaki-test-module-B-1-b',
              GitHubPath: testGitRepo + '/chaki-test-module-B-1-b',
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

var testGetBuildXMLPath = function (test) {
  var appPath = path.resolve(__dirname, '..');
  var p1 = chaki._getBuildXMLPath();
  var p2 = chaki._getBuildXMLPath("packageName");

  // check from specified app dir
  chaki.args.app = "path/to/app";

  var p3 = chaki._getBuildXMLPath();
  var p4  = chaki._getBuildXMLPath("packageName");

  test.ok(p1 === appPath + '/build.xml');
  test.ok(p2 === appPath + '/packageName/build.xml');
  test.ok(p3 === appPath + '/path/to/app/build.xml');
  test.ok(p4 === appPath + '/packageName/build.xml');

  console.log('TEST 3', path.resolve(__dirname, '..'), '1', p1, '2', p2, '3', p3, '4', p4);
  test.done();
};

// givn path to a bujild.xml, this should kick out properties from sencha
var testGetBuildXML = function (test) {
    console.error("TEST 4");
    chaki.args.app = testModulePath;
    var cmds = chaki._loadCmdProperties();
    var workspaceDir = cmds['workspace.packages.dir'];
    var path = chaki._getWorkspacePackagesPath(cmds);
    test.ok(fs.existsSync(path), "Path from _getWorkspacePackagesPath should exist");
    test.ok(typeof cmds === 'object');
    test.ok(typeof workspaceDir === "string");
    test.ok(workspaceDir.split('/').length > 0);
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

// @@TODO write unit test for Install._getPackageInstallPath()
// var  = function (test) {
//     console.error("TEST 4");
//     chaki.args.app = testModulePath;
//     var cmds = chaki._loadCmdProperties();
//     var Install = require()
//     chaki.workspaceDir = cmds['workspace.packages.dir'];


//     chaki.init({app :})
// };

// module.exports.testChakiRuns = testChakiRuns;
// module.exports.testGetAppJsonPath = testGetAppJsonPath;
// module.exports.testGetBuildXMLPath = testGetBuildXMLPath;
// module.exports.testGetBuildXML = testGetBuildXML;
module.exports.testInstall = testInstall;
