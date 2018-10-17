const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml').safeDump;
const composefile = require('composefile');
const compose = require('docker-compose');
const hostile = require('hostile');
const child_process = require('child_process');


const name = process.cwd().split(path.sep).pop().split('-').join('');
const databaseName = `2web_${name}_dev`;
const serverDNSName = `${name}.dev.local`;
let options = {
    data: {
        image: 'busybox',
        volumes: [
            '.:/data',
            './mysql-data:/var/lib/mysql'
        ]
    },
    db: {
        image: 'aimakun/mysql',
        restart: 'always',
        command: '--default-authentication-plugin=mysql_native_password',
        ports: [ '3306' ],
        environment: {
            MYSQL_DATABASE: databaseName,
            MYSQL_ROOT_PASSWORD: 'root'
        },
        volumes: ['/sessions'],
    },
    phpmyadmin: {
        image: 'phpmyadmin/phpmyadmin',
        restart: 'always',
        environment: {
            PMA_ARBITRARY: '1',
            PMA_PORT: 3306,
            PMA_USER: 'root',
            PMA_PASSWORD: 'root'
        },
        links: ['db'],
        ports: [ '8080:80' ],
        volumes: ['/sessions'],
    },
    web: {
        build: __dirname,
        dockerfile: "Dockerfile-php5.6",
        volumes_from: ['data'],
        ports: [ '80' ],
        links: [
            'db',
            'redis',
            'elasticsearch',
            'memcached'
        ],
        environment: {
            MYSQL_HOST: 'db',
            SITE_ENV: 'dev_docker',
            VIRTUAL_HOST: serverDNSName,
            PUBLIC_DIR: '/public'
        },
        volumes: ['/sessions'],
        extra_hosts: [`${serverDNSName}:127.0.0.2`] //edit
    },
    redis: {
        image: "redis",
        ports:
            ["6379:6379"],
        volumes: ['/sessions'],
    },
    elasticsearch: {
        image: 'elasticsearch:6.4.0',
        ports:
            ['9200:9200', '9300:9300']
    },
    memcached: {
        image: 'memcached',
        ports: ["11211:11211"]
    }



};
const buildConfig = function(callback, opt) {
    console.log('creating config for:', serverDNSName);

    if (opt || (callback && typeof callback !== 'function')) {

        let pd = (opt || callback)['public-dir'];
        let phpVers = (opt || callback)['php'];
        phpVers = phpVers === "5" ? "5.6" :
            phpVers === "7" ? "7.2" : "7.2";
        options.web.environment.PUBLIC_DIR = pd ? pd : options.web.environment.PUBLIC_DIR;
        options.web.dockerfile = `Dockerfile-php${phpVers}`;
    }

    fs.writeFileSync(
        path.join(process.cwd(),'docker-compose.yml'),
        yaml(options, {safe: true})
    );
    if (typeof callback === 'function') {
        callback.apply(this, arguments);
    }
};

//TODO: add ability to add custom dev srv
const addDevHostToHostsFile = function() {
    hostile.set('127.0.0.2', serverDNSName, function (err) {
        if (err) {
            console.error(err)
        } else {
            console.log('set /etc/hosts successfully!');
        }
        console.log('Local DNS hosts file rules:');
        console.log(hostile.list());
    });
};

const runCompose = function(callback) {
    console.log('runCompose');
    compose.up({ cwd: process.cwd(), log: true })
        .then(
            () => {
                console.log('docker compose up done!');
                if (typeof callback === 'function') {
                    callback.apply(this, arguments);
                }

                console.log('------------------------------------------------------');
                console.log(`php version: ${options.web.dockerfile}`);
                console.log(`public dir: ${options.web.environment.PUBLIC_DIR}`);
                console.log(`DB name: ${databaseName}`);
                console.log(`DB port: 3306`);
                console.log(`phpmyadmin: http://${serverDNSName}:8080`);
                console.log(`Done! just try it: https://${serverDNSName}/`);
            },
            err => { console.log('something went wrong:', err.message)}
        );
};

module.exports = (function() {
    return {
        run: cb => {


            console.log('checking ip addr....');
            child_process.execSync('(ifconfig | fgrep 127.0.0.2 > /dev/null) || sudo ifconfig lo0 alias 127.0.0.2 up', {stdio:[0,1,2]});

            console.log('checking http/s proxy....');


            child_process.execSync(`docker stop auto-proxy ; docker rm auto-proxy ; docker run -d -p 127.0.0.2:80:80 -p 127.0.0.2:443:443 -v /var/run/docker.sock:/var/run/docker.sock:ro --name auto-proxy --restart always ayufan/auto-proxy`, {stdio:[0,1,2]});

            console.log('...requres root in order to modify hosts file!');


            child_process.execSync(`sudo hostile set 127.0.0.2 ${serverDNSName}`, {stdio:[0,1,2]}, () => {
                console.log('hosts file updated');
            });
            buildConfig(() => runCompose(cb), cb);
        },
        runCompose: runCompose,
        exec: compose.exec,
        buildConfig: buildConfig,
        hostname: () => console.log(serverDNSName),
        addDev2Hosts: addDevHostToHostsFile,
        runProxy: () => {
            const child_process = require('child_process');
            child_process.execSync("docker_http_proxy ", {stdio:[0,1,2]});
        }
    };
})();
