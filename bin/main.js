#!/usr/bin/env node

const argv = require('yargs').argv;
const web2container4dev = require('../index.js');

const help = () => {
    // If they didn't ask for help, then this is not a "success"
    var log = help ? console.log : console.error;
    log('Usage: web2container4dev <command>');
    log('');
    log('  Compiles docker-compose.yaml for project and modify hosts file.');
    log('');

    log('Options:');
    log('');
    log('  -c, --command    Command to call. Can be:');
    log('');
    log('   add-to-hosts,      Add host to system hosts file (requires root)');
    log('');
    log('   build-config,      Just builds Config');
    log('');
    log('   run,      Build Config and run `compose run` command');
    log('');
    log('   exec,      Exec command inside container (see docker-compose#exec)');
    log('');
    log('  --params     params for command. Ex.: --params [\'param1\', \'param2\']');
    log('');
    log('  -h, --help     Display this usage info');
};

if (argv.help || argv.h || argv.length === 0) {
    help();
    process.exit((argv.help || argv.h) ? 0 : 1);
}

const commands = {
    //argv => web2container4dev
    'build-config': 'buildConfig',
    run: 'run',
    exec: 'exec',
    hostname: 'hostname',
    'add-to-hosts': 'addDev2Hosts',
    'run-proxy': 'runProxy'
};

const command = (argv.command || argv.c) && commands[(argv.command || argv.c)];
if (command) {
    web2container4dev[command].call(web2container4dev, argv.params && JSON.parse(argv.params));
} else {
    help();
}


