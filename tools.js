const path = require('path');
const fs = require('fs-extra');
const parseArgs = require('minimist');
const { spawn: _spawn } = require('child_process');
const spawn = async (cmd, args) => new Promise((resolve, reject) => {
    const result = _spawn(cmd, args, { shell: process.platform === 'win32', encoding: 'utf8' });
    result.stdout.on('data', (data) => {
        console.log(data.toString());
    })
    result.stderr.on('data', (data) => {
        console.error(data.toString());
    })
    result.on('error', err => {
        reject(err.toString());
    })
    result.on('exit', code => {
        resolve(code);
    })
});

const BUILD_DIR = 'build';
const DEPLOY_DIR = 'libs';
const LIBJITSIMEET_DIR = 'node_modules/lib-jitsi-meet/';
const LIBFLAC_DIR = 'node_modules/libflacjs/dist/min/';
const RNNOISE_WASM_DIR = 'node_modules/rnnoise-wasm/dist/';
const STYLES_BUNDLE = 'css/all.bundle.css';
const STYLES_DESTINATION = 'css/all.css';
const STYLES_MAIN = 'css/main.scss';
const WEBPACK = './node_modules/.bin/webpack';
const WEBPACK_DEV_SERVER = './node_modules/.bin/webpack-dev-server';
const NODE_SASS = './node_modules/.bin/node-sass';
const CLEANCSS = './node_modules/.bin/cleancss';

const argv = parseArgs(process.argv.slice(2));
const target = argv._[0];
switch (target) {
    case 'compile':
        runPromise(compile, argv, target);
        break;
    case 'deploy':
        runPromise(deploy, argv, target);
        break;
    case 'clean':
        runPromise(clean, argv, target);
        break;
    case 'dev':
        runPromise(dev, argv, target);
}

function runPromise(asyncCallback, argv, target) {
    const handle = setTimeout(() => {
        console.log('time out!');
    }, 100000000);
    spawn('cmd', ['/c', 'chcp', '65001', '>', 'nul'])
        .then(() => asyncCallback(argv))
        .then(() => {
            console.log(`${target} success.`);
            clearTimeout(handle);
        })
        .catch(error => {
            console.error(error);
            clearTimeout(handle);
        });
}

async function compile(argv) {
    await spawn(path.resolve(__dirname, WEBPACK), ['-p'])
}

async function deploy(argv) {
    await deployInit(argv);
    await deployAppBundle(argv);
    await deployRnnoiseBinary(argv);
    await deployLibJitsiMeet(argv);
    await deployLibFlac(argv);
    await deployCss(argv);
    await deployLocal(argv);
}

async function deployInit(argv) {
    console.log('Clean the deploy dir...');
    await fs.remove(DEPLOY_DIR);
    await fs.mkdirp(DEPLOY_DIR);
    console.log('Completed.');
}

async function deployAppBundle(argv) {
    console.log('Deploy the app bundle...');
    await fs.copy(BUILD_DIR, DEPLOY_DIR);
    console.log('Completed.');
}

async function copyFileToDir(from, to) {
    await fs.copy(from, path.join(to, path.basename(from)));
}

async function deployLibJitsiMeet(argv) {
    console.log('Deploy lib-jitsi-meet...');
    await copyFileToDir(`${LIBJITSIMEET_DIR}/lib-jitsi-meet.min.js`, DEPLOY_DIR);
    await copyFileToDir(`${LIBJITSIMEET_DIR}/lib-jitsi-meet.min.map`, DEPLOY_DIR);
    await copyFileToDir(`${LIBJITSIMEET_DIR}/connection_optimization/external_connect.js`, DEPLOY_DIR);
    await copyFileToDir(`${LIBJITSIMEET_DIR}/modules/browser/capabilities.json`, DEPLOY_DIR);
    console.log('Completed.');
}

async function deployLibFlac(argv) {
    console.log('Deploy lib-frac...');
    await copyFileToDir(`${LIBFLAC_DIR}/libflac4-1.3.2.min.js`, DEPLOY_DIR);
    await copyFileToDir(`${LIBFLAC_DIR}/libflac4-1.3.2.min.js.mem`, DEPLOY_DIR);
    console.log('Completed.');
}

async function deployRnnoiseBinary(argv) {
    console.log('Deploy rnnoise binary...');
    await copyFileToDir(`${RNNOISE_WASM_DIR}/rnnoise.wasm`, DEPLOY_DIR);
    console.log('Completed.');
}

async function deployCss(argv) {
    console.log('Deploy css...');
    await spawn(path.resolve(__dirname, NODE_SASS), [STYLES_MAIN, STYLES_BUNDLE]);
    await spawn(path.resolve(__dirname, CLEANCSS), [STYLES_BUNDLE, '>', STYLES_DESTINATION]);
    fs.remove(STYLES_BUNDLE);
    console.log('Completed.');
}

async function checkAccess(path, mode) {
    return new Promise((resolve) => {
        fs.access(path, mode, err => {
            resolve(!err);
        });
    });
}

async function deployLocal(argv) {
    if (process.platform === 'win32') {
        if (await checkAccess('deploy-local.bat', fs.constants.X_OK)) {
            console.log('Deploy local...');
            await spawn('deploy-local.bat');
            console.log('Completed.');
        } else if (await checkAccess('deploy-local.cmd', fs.constants.X_OK)) {
            console.log('Deploy local...');
            await spawn('deploy-local.cmd');
            console.log('Completed.');
        }
    } else if (await checkAccess('deploy-local.sh', fs.constants.X_OK)) {
        console.log('Deploy local...');
        await spawn('./deploy-local.sh');
        console.log('Completed.');
    }
}

async function clean(argv) {
    console.log('Cleaning...');
    await fs.remove(BUILD_DIR);
    console.log('Completed.');
}

async function dev(argv) {
    await deployInit(argv);
    await deployCss(argv);
    await deployRnnoiseBinary(argv);
    await deployLibJitsiMeet(argv);
    await deployLibFlac(argv);
    console.log('Starting the dev server...');
    await spawn(path.resolve(__dirname, WEBPACK_DEV_SERVER));
    console.log('Completed.');
}