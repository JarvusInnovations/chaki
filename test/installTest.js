var chaki = require('../chaki'),
    path = require('path'),
    shell = require('shelljs'),
    testGitRepo : "starsinmypockets";

// quick mock of API
// module A depends on module B
//   not listed
var mockApi : {
    moduleA : {
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

var testChakiRuns = function (test) {
    chaki.init({command : 'test'});
    test.ok(1 === 1);
    test.done();
};

var testGetAppJsonPath = function (test) {
    var jsonPath = chaki._getAppJsonPath();
    test.ok(jsonPath === path.resolve(__dirname, '..', 'app.json'), "_getAppJsonPath should be the same as the chaki path");
    test.ok(chaki._getAppJsonPath('ext/123') === path.resolve(__dirname, '..', 'ext', '123'));
    test.done();
};



module.exports.testChakiRuns = testChakiRuns;
module.exports.testGetAppJsonPath = testGetAppJsonPath;