var chaki = require('../chaki'),
    path = require('path'),
    shell = require('shelljs'),
    rmdir = require('rimraf'),
    _ = require('underscore'),
    fs = require('fs'),
    testModulePath = __dirname + '/testApp/sencha-workspace/SlateAdmin/',
    testGithubAcct = "starsinmypockets";

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
              GitHubPath: testGithubAcct + '/chaki-test-module-A',
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
              GitHubPath: testGithubAcct + '/chaki-test-module-B',
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
              GitHubPath: testGithubAcct + '/chaki-test-module-A-1',
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
              GitHubPath: testGithubAcct + '/chaki-test-module-A-2',
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
              GitHubPath: testGithubAcct + '/chaki-test-module-B-1',
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
              GitHubPath: testGithubAcct + '/chaki-test-module-B-1-a',
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
              GitHubPath: testGithubAcct + '/chaki-test-module-B-1-b',
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
  console.error("TEST 5");
  var pkgDir = 'testApp/sencha-workspace/packages/';
  var pkgPath = path.resolve(__dirname, pkgDir);

  test.expect(14);

  // remove old packages from test app packageDir
  rmdir(pkgPath, function () {
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A') === false , "dep no exist");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A/packages/chaki-test-module-A-1') === false, "dep no exist");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A/packages/chaki-test-module-A-2') === false, "dep no exist");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B') === false, "dep no exist");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B/packages/module-B-1') === false, "dep no exist");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B/packages/module-B-1/packages/chaki-test-module-B-1/packages/chaki-test-module-B-1-a') === false, "dep no exist");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B/packages/module-B-1/packages/chaki-test-module-B-1/packages/chaki-test-module-B-1-b') === false, "dep no exist");

      // put it back
      fs.mkdirSync(pkgPath);
      console.log("111");
      chaki.init({
          command : "install",
          method : "test",
          mockApi : mockApi,
          args : {
              app : '/var/dev/chaki/test/testApp/sencha-workspace/SlateAdmin'
          }
      });
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A'), pkgPath +"/dep exist 1");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A/packages/chaki-test-module-A-1'), pkgPath +"/dep exist 2");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A/packages/chaki-test-module-A-2'), pkgPath +"/dep exist 3");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B'), pkgPath +"/dep exist 4");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B/packages/chaki-test-module-B-1'), pkgPath +"/dep exist 5");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B/packages/chaki-test-module-B-1/packages/chaki-test-module-B-1-a'), pkgPath +"/dep exist 6");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B/packages/chaki-test-module-B-1/packages/chaki-test-module-B-1-b'), pkgPath +"/dep exist 7");
      test.done();
  });
};

var testGetPackageInstallPath = function (test) {
  var testWritten = false;
  test.ok(testWritten === true, "Write testGetPackageInstallPath");
  test.done();
};

var testGetSenchaVersion = function (test) {
  var senchaData;

  chaki.init({
    command : "test",
    args : {
      app : testModulePath
    }
  });

  senchaData = chaki.getSenchaData();

  test.ok(senchaData['app.framework.version'].split(".").length > 3);
  test.ok(['ext', 'touch'].indexOf(senchaData['app.framework']) >= 0);
  test.done();
};

tesGitClone = function (test) {
    var Git = require(__dirname + '/../lib/git');
    
    // test good
    var data = {
      path : 'https://github.com/' + testGithubAcct + '/chaki-test-module-A',
      dest : __dirname + '/testGitRepo'
    };

    rmdir(data.dest, function () {
      var code = Git._gitCloneRepo(data);
      test.ok(code === 0);
      test.ok(fs.existsSync(data.dest));
      test.ok(fs.existsSync(data.dest+'/README.md'));

      // test bad
      // var badData = {
      //   path : 'https://github.com/' + testGithubAcct + '/repo-no-existy',
      //   dest : __dirname + '/test/noExists'
      // };

      // var bad = Install._gitCloneRepo(badData);
      // test.ok(code !== 0);
      // test.ok(!fs.existsSync(badData.dest));

      test.done();      
    });

};

testGitGetBranches = function (test) {
    var Git = require(__dirname + '/../lib/git');

    // test good
    var data = {
      path : 'https://github.com/' + testGithubAcct + '/chaki-test-module-A',
      dest : __dirname + '/testGitRepo'
    };

    Git._gitCloneRepo(data);
    var out = Git._gitGetAllBranches(data);
    test.ok(out.indexOf('master') >= 0);
    test.ok(out.indexOf('origin/test1') >= 0);
    console.log("TGGA 1", out);
    test.done();
};


testGitCheckout = function (test) {
    var Git = require(__dirname + '/../lib/git');

    // setup repo
    var data = {
      path : 'https://github.com/' + testGithubAcct + '/chaki-test-module-A',
      dest : __dirname + '/testGitRepo'
    };

    rmdir(data.dest, function () {
      Git._gitCloneRepo(data);
      var result = Git._gitCheckoutBranch({path : data.dest, branch : 'test2'});

      _.each(result, function (r) {
        test.ok(r.code === 0, r + 'status ok');
      });
      test.ok(fs.existsSync(data.dest + '/test2'), data.dest + '/test2 exists');
      test.ok(!fs.existsSync(data.dest + '/test21'), data.dest + '/test21 NO EXIST');
      test.ok(!fs.existsSync(data.dest + '/test1'), data.dest + '/test1 not present');

      test.done();    
    });
};

testGetBestBranch = function (test) {
  var Git = require(__dirname + '/../lib/git');
  var data = {};

  chaki.init({
    command : "test",
    args : {
      app : testModulePath
    }
  });

  data.dest = __dirname + '/testGitRepo';
  data.senchaInfo = chaki.getSenchaInfo();

  var result = Git._getBestBranch(data);
  console.log("fbb 1", result);
  test.done();

  // @@TODO:
  // implement search algorithm
  // add branches to test repo to reflect real life use cases
  // integrate at install.js
  // move git stuff to lib/git.js
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

/*
 * Chaki unit tests
 */
// module.exports.testChakiRuns = testChakiRuns;
// module.exports.testGetAppJsonPath = testGetAppJsonPath;
// module.exports.testGetBuildXMLPath = testGetBuildXMLPath;
// module.exports.testGetBuildXML = testGetBuildXML;
// module.exports.testGitGetBranches = testGitGetBranches;
// module.exports.testGetSenchaVersion = testGetSenchaVersion;

/**
 * Git Stuff 
 */
 module.exports.tesGitClone = tesGitClone;
 module.exports.testGitCheckout = testGitCheckout;
 module.exports.testGitGetBranches = testGitGetBranches;
 module.exports.testGetBestBranch = testGetBestBranch;

/*
 * Installer
 */
 // module.exports.testGetPackageInstallPath = testGetPackageInstallPath;
