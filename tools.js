/* global __dirname */
const { spawn: _spawn } = require('child_process');
const fs = require('fs-extra');
const parseArgs = require('minimist');
const path = require('path');
const process = require('process');

const argv = parseArgs(process.argv.slice(2));
const target = argv._[0];

const spawn = async (cmd, args) => new Promise((resolve, reject) => {
    const result = _spawn(cmd, args, { shell: process.platform === 'win32' });

    result.stdout.on('data', data => {
        console.log(data.toString());
    });
    result.stderr.on('data', data => {
        console.error(data.toString());
    });
    result.on('error', err => {
        reject(err.toString());
    });
    result.on('exit', code => {
        resolve(code);
    });
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

const runPromise = asyncCallback => {
    const handle = setTimeout(() => {
        console.log('time out!');
    }, 100000000);
    const startWorker = async () => {
        if (process.platform === 'win32') {
            return spawn('cmd', [ '/c', 'chcp', '65001', '>', 'nul' ]);
        }
    };

    startWorker()
        .then(() => asyncCallback())
        .then(() => {
            console.log(`${target} success.`);
            clearTimeout(handle);
        })
        .catch(error => {
            console.error(error);
            clearTimeout(handle);
        });
};

/**
 * compile
 * @returns {Promise<void>} nothing
 */
async function compile() {
    await spawn(path.resolve(__dirname, WEBPACK), [ '-p' ]);
}

const deployInit = async () => {
    console.log('Clean the deploy dir...');
    await fs.remove(DEPLOY_DIR);
    await fs.mkdirp(DEPLOY_DIR);
    console.log('Completed.');
};

const deployAppBundle = async () => {
    console.log('Deploy the app bundle...');
    await fs.copy(BUILD_DIR, DEPLOY_DIR);
    console.log('Completed.');
};

const copyFileToDir = async (from, to) => {
    await fs.copy(from, path.join(to, path.basename(from)));
};

const deployLibJitsiMeet = async () => {
    console.log('Deploy lib-jitsi-meet...');
    await copyFileToDir(`${LIBJITSIMEET_DIR}/lib-jitsi-meet.min.js`, DEPLOY_DIR);
    await copyFileToDir(`${LIBJITSIMEET_DIR}/lib-jitsi-meet.min.map`, DEPLOY_DIR);
    await copyFileToDir(`${LIBJITSIMEET_DIR}/connection_optimization/external_connect.js`, DEPLOY_DIR);
    await copyFileToDir(`${LIBJITSIMEET_DIR}/modules/browser/capabilities.json`, DEPLOY_DIR);
    console.log('Completed.');
};

const deployLibFlac = async () => {
    console.log('Deploy lib-frac...');
    await copyFileToDir(`${LIBFLAC_DIR}/libflac4-1.3.2.min.js`, DEPLOY_DIR);
    await copyFileToDir(`${LIBFLAC_DIR}/libflac4-1.3.2.min.js.mem`, DEPLOY_DIR);
    console.log('Completed.');
};

const deployRnnoiseBinary = async () => {
    console.log('Deploy rnnoise binary...');
    await copyFileToDir(`${RNNOISE_WASM_DIR}/rnnoise.wasm`, DEPLOY_DIR);
    console.log('Completed.');
};

const deployCss = async () => {
    console.log('Deploy css...');
    await spawn(path.resolve(__dirname, NODE_SASS), [ STYLES_MAIN, STYLES_BUNDLE ]);
    await spawn(path.resolve(__dirname, CLEANCSS), [ STYLES_BUNDLE, '>', STYLES_DESTINATION ]);
    fs.remove(STYLES_BUNDLE);
    console.log('Completed.');
};

const checkAccess = async (p, mode) => new Promise(resolve => {
    fs.access(p, mode, err => {
        resolve(!err);
    });
});

const deployLocal = async () => {
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
};

/**
 * deploy
 * @returns {Promise<void>} nothing
 */
async function deploy() {
    await deployInit();
    await deployAppBundle();
    await deployRnnoiseBinary();
    await deployLibJitsiMeet();
    await deployLibFlac();
    await deployCss();
    await deployLocal();
}

/**
 * clean
 * @returns {Promise<void>} nothing
 */
async function clean() {
    console.log('Cleaning...');
    await fs.remove(BUILD_DIR);
    console.log('Completed.');
}

/**
 * dev
 * @returns {Promise<void>} nothing
 */
async function dev() {
    await deployInit();
    await deployCss();
    await deployRnnoiseBinary();
    await deployLibJitsiMeet();
    await deployLibFlac();
    console.log('Starting the dev server...');
    await spawn(path.resolve(__dirname, WEBPACK_DEV_SERVER));
    console.log('Completed.');
}

switch (target) {
case 'compile':
    runPromise(compile);
    break;
case 'deploy':
    runPromise(deploy);
    break;
case 'clean':
    runPromise(clean);
    break;
case 'dev':
    runPromise(dev);
}
