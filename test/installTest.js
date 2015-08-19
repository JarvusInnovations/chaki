var path = require('path'),
    shell = require('shelljs'),
    rmdir = require('rimraf'),
    _ = require('underscore'),
    fs = require('fs'),
    testModulePath = __dirname + '/testApp/sencha-workspace/SlateAdmin/',
    testGithubAcct = "starsinmypockets",
    chaki,
    x=0;

// report uncaught exceptions please
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
    test.expect(1);
    chaki.init({
        command : 'test',
        args : {}
    });
    test.ok(1 === 1);
    test.done();
};

testChakiCurDir = function (test) {
    chaki.init({
        command : 'test',
        args : {}
    });
    console.log("CURDIR", __dirname);
    test.ok(haki.curPath == path.resolve(__dirname, '..'));
    test.done();
};


var testGetAppJsonPath = function (test) {
    chaki.init({
        command : 'test',
        args : {}
    });
    var jsonPath = chaki.getAppJsonPath();
    console.error("TEST 2", jsonPath, chaki.args);
    test.ok(path.resolve(jsonPath) === path.resolve(__dirname, '..', 'app.json'), "_getAppJsonPath should be the same as the chaki run if args.app not set");
  
    test.done();
};

var testGetBuildXMLPath = function (test) {
  var appPath = path.resolve(__dirname, '..');
  var p1 = chaki._getBuildXMLPath();

  // check from specified app dir
  chaki.args.app = "path/to/app";

  var p3 = chaki._getBuildXMLPath();
  console.log(p1, p3);

  test.ok(p1 === appPath + '/build.xml');
  test.ok(p3 === appPath + '/path/to/app/build.xml');

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

/**
 * This does a test install with a fake project 
 * with a fairly complex dependency structure
 **/
var testInstall = function (test) {
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

  senchaData = chaki.getSenchaInfo();

  test.ok(senchaData['app.framework.version'].split(".").length > 3);
  test.ok(['ext', 'touch'].indexOf(senchaData['app.framework']) >= 0);
  test.done();
};


testCacheProps = function (test) {
    chaki.init({
      command : "test",
      args : {
        app : testModulePath
      }
    });

    var a = process.hrtime()[1];
    chaki._loadCmdProperties();
    var b = process.hrtime()[1];
    var elapse1 = b - a;

    var a1 = process.hrtime()[1];
    chaki._loadCmdProperties();
    var b1 = process.hrtime()[1];
    var elapse2 = b1 - a1;

    test.ok(elapse2 * 10 < elapse1, "Getting chached properties is way faster");
    test.ok(typeof chaki.cmdProperties === 'object', "Command properties stored as object");
    test.done();
};

module.exports.testCacheProps = testCacheProps;
    
tesGitClone = function (test) {
    var Git = require(__dirname + '/../lib/git');

    // test good
    var data = {
      path : 'https://github.com/' + testGithubAcct + '/chaki-test-module-A',
      dest : __dirname + '/testGitRepo'
    };

    console.log(">>>", data);
    rmdir(data.dest, function (err) {
      if (err) console.log("...err",err);
      var code = Git.gitCloneRepo(data);
      test.ok(code === 0);
      test.ok(fs.existsSync(data.dest));
      test.ok(fs.existsSync(data.dest+'/README.md'));

      // test bad
      // var badData = {
      //   path : 'https://github.com/' + testGithubAcct + '/repo-no-existy',
      //   dest : __dirname + '/test/noExists'
      // };

      // var bad = Install.gitCloneRepo(badData);
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

    Git.gitCloneRepo(data);
    var out = Git._gitGetAllBranches(data);
    test.ok(out.indexOf('master') >= 0);
    test.ok(out.indexOf('ext/5.1.1') >= 0);
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
      Git.gitCloneRepo(data);
      var result = Git.gitCheckoutBranch({path : data.dest, branch : 'test2'});
      console.log("AA",result);
      test.ok(result.code === 0, 'status ok');
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

  var result = Git.getBestBranch(data);
  console.log("fbb 1", result);
  test.done();
};

module.exports.setUp = function (cb) {
  chaki = require('../chaki');
  x++;
  console.log("SETUP", chaki.args);
  cb();
};

module.exports.tearDown = function (cb) {
    chaki = {};
  console.log("TEARDOWN", chaki);
    cb();
};
/*
 * Chaki unit tests
 */
// module.exports.testChakiRuns = testChakiRuns;
// module.exports.testGetBuildXMLPath = testGetBuildXMLPath;
// module.exports.testChakiCurDir = testChakiCurDir;
// module.exports.testGetBuildXML = testGetBuildXML;
// module.exports.testGitGetBranches = testGitGetBranches;
// module.exports.testGetSenchaVersion = testGetSenchaVersion;
// module.exports.testGetAppJsonPath = testGetAppJsonPath;

// /**
//  * Git Stuff 
// //  */
 // module.exports.tesGitClone = tesGitClone;
 // module.exports.testGitCheckout = testGitCheckout;
 // module.exports.testGitGetBranches = testGitGetBranches;
 // module.exports.testGetBestBranch = testGetBestBranch;

// /*
//  * Installer
//  */
 module.exports.testInstall = testInstall;
