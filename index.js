const path = require('path');
const composefile = require('composefile');
const compose = require('docker-compose');

const name = process.cwd().split(path.sep).pop().replace('-', '')
// console.log(name);
const options = {
    outputFolder: __dirname,
    filename: 'docker-compose.yml',

    services: {
        data: {
            image: 'busybox',
            volumes: ['.:/data']
        },
        db: {
            image: 'aimakun/mysql',
            ports: [ '3306' ],
            environment: {
                MYSQL_DATABASE: `2web_${name}_dev`,//sitename_db ## <--- Edit here
                MYSQL_ROOT_PASSWORD: 'root' //## <--- Edit here
            }
        },
        web: {
            image: 'aimakun/docker-laravel4-projects',
            volumes_from: ['data'],
            ports: [ '80' ],
            links: ['db'],
            environment: {
                MYSQL_HOST: 'db',
                SITE_ENV: 'dev_docker',
                VIRTUAL_HOST: `${name}.dev.local` //EDIT
            },
            extra_hosts: [`${name}.dev.local:127.0.0.1`] //edit
        }
    },

    // },
    networks: {
        outside: {
            external: true
        }
    },
    volumes: {
        data: {
            external: true
        }
    }
};

const buildConfig = function(callback) {
    composefile(options, err => {
        console.log('docker-compose.yml created.');
        if (typeof callback === 'function') {
            callback.apply(this, arguments);
        }
    });

};

const runCompose = function(callback) {
    compose.up({ cwd: process.cwd(), log: true })
        .then(
            () => {
                console.log('docker compose up done!');
                if (typeof callback === 'function') {
                    callback.apply(this, arguments);
                }
            },
            err => { console.log('something went wrong:', err.message)}
        );
};

module.exports = (function() {
    return {
        run: cb => buildConfig(() => runCompose(cb)),
        exec: compose.exec,
        buildConfig: cb => buildConfig(cb)
    };
})();
