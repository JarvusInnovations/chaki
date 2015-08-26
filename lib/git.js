shell = require('shelljs'),
    fs = require('fs'),
    _ = require('underscore');

console.hide = function (args) {
    return null;
};

// @@TODO - remove _underscore for non-private functions!
/**
 * Git Library
 **/
module.exports = {
    gitCloneRepo : function (opts) {
         var code = (shell.exec('git clone ' + opts.path + ' ' + opts.dest).code); 
         console.hide("GCR", code);
         return code;
    },

    // checkout the required version of the package
    gitCheckoutBranch : function (opts) {
        var git1,
            git2;
        console.hide("GCB>>", opts);
        shell.cd(opts.path);
        return shell.exec('git checkout ' + opts.branch);
    },

    gitPull : function (opts) {
        shell.cd(opts.path);
        return shell.exec('git pull origin ' + opts.branch);
    },
    /** 
     * When grabbing a repo, chaki should look at all the available remote branches and if a framework and/or version-specific branch is available clone that instead of master
     *
     * For example, if an app is touch 2.4.1.527, chaki would pick the first branch found of:
     *
     * touch/2.4.1.527
     * touch/2.4.1
     * touch/2.4
     * touch/2
     * touch
     * master
     */
     getBestBranch : function (opts) {
        var senchaStuff = opts.senchaInfo,
            branches =  this._gitGetAllBranches({dest:opts.dest}),
            frameworkVer = senchaStuff['app.framework.version'],
            framework = senchaStuff['app.framework'],
            frameworkVersionStack = frameworkVer.split('.'),
            path = framework + '/' + frameworkVer,
            that = this,
            winner;

        console.hide("FBB 1", senchaStuff, branches, frameworkVer, framework, frameworkVersionStack);

        if (this._inBranch(branches, path)) {
            return path;
        } else {
            _.each(frameworkVersionStack, function (deg) {
                // chop the next degree of the version off of the path
                // the +1 includes the . or the / in the path
                path = path.substr(0, path.length - (deg.length + 1)); 
                console.hide("ttt",path);
                if (that._inBranch(branches, path)) winner = path;
            });
        }

        if (winner) {
         console.hide("WINNER", winner);
         return winner;   
        }

        // check if there's a branch named as the framework
        if (this._inBranch(branches, framework)) return framework;

        // just return master
        return 'master';
    },

    // is the path in the branches array?
    _inBranch : function (branches, path) {
        console.hide(branches, path);    
        return branches.indexOf(path) >= 0;
    },

    _gitGetAllBranches : function (opts) {
        console.hide("GGGGG", opts);
        var ran,
            out;

        shell.cd(opts.dest);
        ran = shell.exec("git for-each-ref --format='%(refname:short)'").output.split('\n');
        console.hide(ran);
        out = [];
        _.each(ran, function (ref) {
            ref = ref.replace(/(\n|\r)+$/, '');
            ref = ref.replace('origin/', '');
            console.hide("...", ref);
            out.push(ref);
        });

        return out;
    }
}