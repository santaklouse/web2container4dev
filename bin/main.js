#!/usr/bin/env node
const argv = require('yargs').argv;
const web2container4dev = require('../index.js');

var help = false
var dashdash = false
var noglob = false
var args = process.argv.slice(2).filter(function(arg) {
    if (dashdash)
        return !!arg
    else if (arg === '--')
        dashdash = true
    else if (arg.match(/^(-+|\/)(h(elp)?|\?)$/))
        help = true
    else
        return !!arg
});

if (help || args.length === 0) {
    // If they didn't ask for help, then this is not a "success"
    var log = help ? console.log : console.error;
    log('Usage: web2container4dev <command>');
    log('');
    log('  Compiles docker-compose.yaml for project and modify hosts file.');
    log('');
    log('Commands:');
    log('');
    log('  build-config,      Just builds Config');
    log('');
    log('  run,      Build Config and run `compose run` command');
    log('');
    log('  exec,      Exec command inside container (see docker-compose#exec)');
    log('Options:');
    log('');
    log('  -h, --help     Display this usage info');
    process.exit(help ? 0 : 1);
}

if (argv.buildConfig) {
    web2container4dev.buildConfig();
} else if (argv.run) {
    web2container4dev.run();
} else if (argv.exec) {
    web2container4dev.exec(argv.exec);
}
