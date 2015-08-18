shell = require('shelljs'),
    fs = require('fs'),
    _ = require('underscore');

console.show = function () {
    console.log(arguments);
    console.log('\n');
};


console.hide = function (args) {
    return null;
};

module.exports = {
    // find branch most associated with sencha framework and version
    _findBestBranch : function (opts) {
        var senchaStuff = opts.senchaInfo,
            branches =  this._gitGetAllBranches(opts.dest),
            framework;

        console.show("FBB 1", senchaStuff, branches);
    },

    _gitGetAllBranches : function (opts) {
        console.show("GGA1", opts);
        var ran,
            out;

        shell.cd(opts.dest);
        ran = shell.exec("git for-each-ref --format='%(refname:short)'");
        console.log(ran.output.split('\n'));
        out = ran.output.split('\n');
        _.each(out, function (ref) {
            ref.replace(/(\n|\r)+$/, '');
        });
        // parser(ran.output, function (err, data) {
        //     if (err) console.log (err);
        //     console.show("GGA2", data);
        //     out = data;
        // });
        return out;
    },

    // checkout the required version of the package
    _gitCheckoutBranch : function (opts) {
        var git1,
            git2;
            
        shell.cd(opts.path);
        git1 = shell.exec('git checkout -b ' + opts.branch);
        git2 = shell.exec('git pull origin ' + opts.branch);
        return ([git1, git2]);
    },

    _gitCloneRepo : function (opts) {
         var code = (shell.exec('git clone ' + opts.path + ' ' + opts.dest).code); 
         console.show("GCR", code);
         return code;
    }
}