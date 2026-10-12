const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const base = 'react/features/base/conference/';
function load(file, imports = {}) {
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
    vm.runInNewContext(source, { exports, require: name => imports[name] ?? {} }, { filename: file });
    return exports;
}
const native = load(`${base}prepareNativeE2EE.native.ts`);
const web = load(`${base}prepareNativeE2EE.web.ts`);
const types = load(`${base}actionTypes.ts`);
const connectionTypes = load('react/features/base/connection/actionTypes.ts');
let reduceConnection;
load('react/features/base/connection/reducer.ts', {
    './actionTypes': connectionTypes,
    '../redux/ReducerRegistry': { default: { register: (_name, reduce) => { reduceConnection = reduce; } } },
    '../redux/functions': { assign: (state, values) => ({ ...state, ...values }) },
    '../lib-jitsi-meet': { JitsiConnectionErrors: {} }
});
const connectionActions = load('react/features/base/connection/actions.any.ts', {
    './actionTypes': connectionTypes,
    './logger': { default: { info() {} } },
    '../conference/functions': { getCurrentConference: state => state['features/base/conference'].joining }
});
const nativeConfig = () => ({ e2ee: { nativeManaged: true }, p2p: { enabled: false }, disableSimulcast: true,
    videoQuality: { mobileCodecPreferenceOrder: ['VP8'] } });

function fixture({ config = nativeConfig(), platform = native, factoryError, enableError, capable = true } = {}) {
    const calls = [];
    const actions = [];
    let resolveEnable;
    const conference = {
        options: { config }, on() {}, addCommandListener() {},
        isE2EESupported: () => capable,
        setE2EEEnabled(enabled) {
            calls.push(['enable', enabled]);
            return enableError ? Promise.reject(enableError) : new Promise(resolve => { resolveEnable = resolve; });
        },
        join(...args) { calls.push(['join', ...args]); }
    };
    const connection = { disconnect() { calls.push(['disconnect']); return Promise.resolve(); }, initJitsiConference() {
        calls.push(['create']);
        if (factoryError) throw factoryError;
        return conference;
    } };
    const state = { 'features/base/config': config, 'features/base/tracks': [],
        'features/base/conference': { room: 'unit-test', password: 'unit-test-password' },
        'features/base/connection': { connection, locationURL: undefined } };
    const loaded = load(`${base}actions.any.ts`, {
        './actionTypes': types,
        './prepareNativeE2EE': platform,
        './logger': { default: { error() {} } },
        './functions': { getConferenceOptions: () => ({ config }), sendLocalParticipant() {} },
        '../config/functions': { getReplaceParticipant: () => false },
        '../connection/actions': connectionActions,
        '../connection/constants': { JITSI_CONNECTION_CONFERENCE_KEY: 'conference' },
        '../tracks/functions': { getLocalTracks: () => [] },
        '../util/uri': { getBackendSafeRoomName: room => room },
        '../lib-jitsi-meet': { JitsiConferenceEvents: {}, JitsiE2ePingEvents: {},
            JitsiConferenceErrors: { SETTINGS_ERROR: 'conference.settingsError' },
            JitsiConnectionErrors: { OTHER_ERROR: 'connection.otherError' } }
    });
    const dispatch = action => {
        if (typeof action === 'function') return action(dispatch, () => state);
        actions.push(action);
        state['features/base/connection'] = reduceConnection(state['features/base/connection'], action);
        if (action.type === types.CONFERENCE_WILL_JOIN) state['features/base/conference'].joining = action.conference;
        return action;
    };
    return { calls, actions, conference, state, start: () => dispatch(loaded.createConference()),
        acknowledge: () => resolveEnable() };
}

test('real SDK createConference waits for native sender key acknowledgement before its original join', async () => {
    const f = fixture();
    const ready = f.start();
    await Promise.resolve();
    assert.deepEqual(f.calls, [['create'], ['enable', true]]);
    f.acknowledge();
    await ready;
    assert.deepEqual(f.calls, [['create'], ['enable', true], ['join', 'unit-test-password', false]]);
});

test('real SDK action does not join after hangup while native keys are initializing', async () => {
    const f = fixture();
    const ready = f.start();
    await Promise.resolve();
    f.state['features/base/conference'].joining = undefined;
    f.acknowledge();
    await ready;
    assert.equal(f.calls.filter(([name]) => name === 'join').length, 0);
});

test('native key failure dispatches the existing conference failure path without plaintext join', async () => {
    const f = fixture({ enableError: new Error('backend failure') });
    await f.start();
    assert.equal(f.calls.filter(([name]) => name === 'join').length, 0);
    const failed = f.actions.find(action => action.type === types.CONFERENCE_FAILED);
    assert.equal(failed.conference, f.conference);
    assert.equal(failed.error.name, 'conference.settingsError');
});

test('a rejected explicit native factory disconnects even when the real reducer clears its connection', async () => {
    const f = fixture({ factoryError: new Error('unsupported provider') });
    await f.start();
    assert.deepEqual(f.calls, [['create'], ['disconnect']]);
    assert.deepEqual(f.actions.map(action => action.type), [connectionTypes.CONNECTION_FAILED]);
    assert.equal(f.actions[0].error.recoverable, false);
    assert.equal(f.state['features/base/connection'].connection, undefined);
});

test('ordinary native conferences and browsers preserve synchronous original join', () => {
    for (const options of [{ config: {} }, { platform: web }]) {
        const f = fixture(options);
        f.start();
        assert.deepEqual(f.calls, [['create'], ['join', 'unit-test-password', false]]);
    }
});

test('unsupported native backend and unsupported codec/routing settings fail before join', async () => {
    for (const options of [{ capable: false }, { config: { ...nativeConfig(), p2p: { enabled: true } } },
        { config: { ...nativeConfig(), videoQuality: { mobileCodecPreferenceOrder: ['VP8', 'H264'] } } },
        { config: { ...nativeConfig(), videoQuality: {} } },
        { config: { ...nativeConfig(), disableSimulcast: false } }]) {
        const f = fixture(options);
        await f.start();
        assert.deepEqual(f.calls, [['create']]);
        assert.ok(f.actions.some(action => action.type === types.CONFERENCE_FAILED));
    }
});

test('real packaged LJM codec selection filters a mobile VP8-only list instead of merely preferring it', () => {
    const file = 'node_modules/lib-jitsi-meet/dist/esm/modules/qualitycontrol/CodecSelection.js';
    const exports = {};
    const CodecMimeType = { AV1: 'av1', VP9: 'vp9', VP8: 'vp8', H264: 'h264' };
    const imports = {
        '@jitsi/logger': { getLogger: () => ({ info() {} }) },
        '../../service/RTC/CodecMimeType': { CodecMimeType },
        '../../service/RTC/MediaType': { MediaType: { VIDEO: 'video' } },
        '../../service/RTC/StandardVideoQualitySettings': {},
        '../../service/RTC/VideoType': {},
        '../browser': { default: { isMobileDevice: () => true, isFirefox: () => false,
            isWebKitBased: () => false, supportsVP9: () => true } }
    };
    const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
    vm.runInNewContext(source, { exports, require: name => imports[name], window: {
        RTCRtpReceiver: { getCapabilities: () => ({ codecs: Object.values(CodecMimeType)
            .map(codec => ({ mimeType: `video/${codec}` })) }) }
    } });
    const selection = new exports.CodecSelection({}, { jvb: { preferenceOrder: ['VP8'] } });
    assert.deepEqual(Array.from(selection.getCodecPreferenceList('jvb')), ['vp8']);
});
