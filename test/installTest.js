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
    chaki.extend({
        command : 'test',
        args : {}
    });
    test.ok(1 === 1);
    test.done();
};

testChakiCurDir = function (test) {
    chaki.extend({
        command : 'test',
        args : {}
    });
    console.log(chaki.cwd);
    test.ok(chaki.cwd == path.resolve(__dirname, '..'));
    test.done();
};


var testGetAppJsonPath = function (test) {
    chaki.extend({
        command : 'test',
        args : {}
    });
    console.log("AA", chaki.args);
    var jsonPath = chaki.getAppJsonPath();
    console.log("AA", chaki.args, jsonPath);
    test.ok(path.resolve(jsonPath) === path.resolve(__dirname, '..', 'app.json'), "_getAppJsonPath should be the same as the chaki run if args.app not set");
  
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

    chaki.args.app = testModulePath;
    chaki.mockApi = mockApi;
    var cmdProperties = chaki.getCmdProps();
    chaki.workspacePackagesPath = cmdProperties['workspace.packages.dir'];
    var Install = require(__dirname + '/../lib/install');
    Install.installPackages({app: chaki, method : 'test'});

      // console.log("111");
      // chaki.extend({
      //     command : "install",
      //     method : "test",
      //     mockApi : mockApi,
      //     args : {
      //         app : '/var/dev/chaki/test/testApp/sencha-workspace/SlateAdmin'
      //     }
      // });
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A'), pkgPath +"/dep exist 1");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A-1'), pkgPath +"/dep exist 2");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-A-2'), pkgPath +"/dep exist 3");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B'), pkgPath +"/dep exist 4");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B-1'), pkgPath +"/dep exist 5");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B-1-a'), pkgPath +"/dep exist 6");
      test.ok(fs.existsSync(pkgPath + '/chaki-test-module-B-1-b'), pkgPath +"/dep exist 7");
      test.done();
  });
};

testInstallSingle = function (test) {
    
    test.done();
};

var testGetPackageInstallPath = function (test) {
  var testWritten = false;
  test.ok(testWritten === true, "Write testGetPackageInstallPath");
  test.done();
};

var testGetSenchaVersion = function (test) {
  var senchaData;

  chaki.extend({
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

testGetAppProps = function (test) {
    chaki.extend({
      command : "test",
      args : {
        app : testModulePath
      }
    });

    var result = chaki.getAppProps(['id']);

    console.log("tgap", result);

    test.ok(result.id === "e21d2a04-1fe0-4793-a299-186188656a28");
    test.done();
};

testGetCmdProps = function (test) {
    chaki.extend({
      command : "test",
      args : {
        app : testModulePath
      }
    });
    
    var result = chaki.getCmdProps(['workspace.build.dir', 'user.name']);
    console.log(result);
    test.ok(result['user.name'] === 'paul');
    test.ok(path.isAbsolute(result['workspace.build.dir']));
    test.done();
};

testCacheProps = function (test) {
    chaki.extend({
      command : "test",
      args : {
        app : testModulePath
      }
    });

    var a = process.hrtime()[1];
    chaki.getCmdProps();
    var b = process.hrtime()[1];
    var elapse1 = b - a;

    var a1 = process.hrtime()[1];
    chaki.getCmdProps();
    var b1 = process.hrtime()[1];
    var elapse2 = b1 - a1;

    test.ok(elapse2 < elapse1, "Getting chached properties is way faster");
    test.ok(typeof chaki.cmdProperties === 'object', "Command properties stored as object");
    test.done();
};

testGetNpmData = function (test) {
    var data = chaki.getNpmData();
    console.log(data);
    test.ok(typeof data === 'object');
    
    var data1 = chaki.getNpmData('version').version;
    test.ok(data1.split('.').length === 3);
    test.done();
};

testGetUA = function (test) {
  chaki.args.app = testModulePath;
  var UA = chaki.getUserAgent();
  test.done();
};

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

  chaki.extend({
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

testWriteAppJson = function (test) {
  chaki.extend({
    command : "test",
    args : {
      app : testModulePath
    }
  });

    test.ok(chaki.updateAppJson({packageName : "test-package-name"}));
    var appJson = fs.readFileSync(chaki.getAppJsonPath(), 'utf8');
    // use injection to invalidate json and test for fail
   // test.ok(!chaki.updateAppJson({packageName : "test-package-name\",,"}));
    test.done();
};

testAddTargetHook = function (test) {
  chaki.extend({
    args : {
      app : testModulePath
    }
  });
  chaki.addTargetHook();
  test.done();
};

/**
 * SETUP
 */
module.exports.setUp = function (cb) {
 shell.cd(path.resolve(__dirname, '..'));
 console.log(process.cwd());
  chaki = require(process.cwd() + '/chaki');
  chaki.args = {};
  x++;
  console.log("TEST " + x, chaki.args);
  cb();
};

module.exports.tearDown = function (cb) {
  chaki = {};
  console.log("TEARDOWN", chaki);
  cb();
};


// /*
//  * Chaki unit tests
//  */
// module.exports.testGetNpmData = testGetNpmData;
// module.exports.testCacheProps = testCacheProps;
// module.exports.testChakiRuns = testChakiRuns;
// module.exports.testChakiCurDir = testChakiCurDir;
// module.exports.testGitGetBranches = testGitGetBranches;
// module.exports.testGetSenchaVersion = testGetSenchaVersion;
// module.exports.testGetAppJsonPath = testGetAppJsonPath;
// module.exports.testCmdAppProps = testGetCmdProps;
// module.exports.testGetAppProps = testGetAppProps;
//module.exports.testGetUA = testGetUA;
// module.exports.testWriteAppJson = testWriteAppJson;
module.exports.testAddTargetHook = testAddTargetHook;


// /**
//  * Git Stuff 
//  */
// module.exports.tesGitClone = tesGitClone;
// module.exports.testGitCheckout = testGitCheckout;
// module.exports.testGitGetBranches = testGitGetBranches;
// module.exports.testGetBestBranch = testGetBestBranch;

// /*
//  * Installer
//  */
// module.exports.testInstall = testInstall;
// module.exports.testInstallSingle = testInstallSingle;
