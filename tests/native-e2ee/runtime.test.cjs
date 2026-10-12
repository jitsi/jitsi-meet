const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const support = 'react/features/base/lib-jitsi-meet/native-e2ee/';
const globals = { console, Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array,
    Int32Array, Uint8ClampedArray, Float32Array, ArrayBuffer, setTimeout, clearTimeout };
const decode = value => Buffer.from(value, 'base64').toString('latin1');

function load(file, imports = {}, context = vm.createContext({ ...globals })) {
    const exports = {};
    context.exports = exports;
    context.require = name => {
        assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
        return typeof imports[name] === 'function' ? imports[name]() : imports[name];
    };
    const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
    }).outputText;
    vm.runInContext(compiled, context, { filename: file });
    return exports;
}
const runtime = load(`${support}runtime.ts`);

function registration(options = {}) {
    const context = vm.createContext({ ...globals, HermesInternal: {}, JITSI_MEET_LITE_SDK: false,
        crypto: { getRandomValues: () => assert.fail('insecure fallback') }, ...options.globals });
    const originalEntropy = context.crypto.getRandomValues;
    const methods = ['jitsiE2EEConferenceCreate', 'jitsiE2EEConferenceSetKey',
        'jitsiE2EEConferenceRemoveParticipant', 'jitsiE2EEConferenceClose',
        'jitsiE2EEBindReceiver', 'jitsiE2EEVerifySender', 'jitsiE2EERetirePeer', 'jitsiE2EERatchet'];
    const bridge = options.bridge ?? Object.fromEntries(methods.map(name => [name, () => {}]));
    const entropy = options.entropy ?? { getRandomBase64: count => crypto.randomBytes(count).toString('base64') };
    const PeerConnection = { isNativeManagedE2EESupported: () => options.capable !== false };
    let loads = 0;
    let inits = 0;
    const providers = [];
    const api = options.api ?? { registerNativeE2EE: provider => providers.push(provider) };
    const exports = load(`${support}register.native.ts`, {
        'abab': { atob: decode },
        'react-native': { NativeModules: { WebRTCModule: bridge, RNGetRandomValues: entropy },
            Platform: { OS: options.platform ?? 'ios' } },
        'react-native-webrtc': { RTCPeerConnection: PeerConnection },
        './runtime': runtime,
        '@matrix-org/olm/olm_legacy.js': () => {
            loads++;
            if (options.olmFailure) throw new Error('Olm unavailable');
            const olm = { init() { inits++; } };
            context.Olm = olm;
            return olm;
        }
    }, context);
    return { context, originalEntropy, providers, api, exports, bridge, PeerConnection,
        counts: () => ({ loads, inits }) };
}

test('stock, lite, non-Hermes and unsupported native builds retain ordinary startup', () => {
    for (const options of [{ bridge: {} }, { capable: false }, { api: {} }, { entropy: {} },
        { globals: { HermesInternal: undefined } }, { globals: { JITSI_MEET_LITE_SDK: true } },
        { platform: 'windows' }, { platform: 'android', capable: false }]) {
        const fixture = registration(options);
        assert.equal(fixture.exports.registerNativeE2EERuntime(fixture.api), false);
        assert.equal(fixture.context.crypto.getRandomValues, fixture.originalEntropy);
        assert.equal(fixture.providers.length, 0);
        assert.deepEqual(fixture.counts(), { loads: 0, inits: 0 });
    }
});

test('capability, not platform name, gates iOS and Android registration', () => {
    for (const platform of ['ios', 'android']) {
        const fixture = registration({ platform });
        assert.equal(fixture.exports.registerNativeE2EERuntime(fixture.api), true);
        assert.equal(fixture.exports.registerNativeE2EERuntime(fixture.api), true);
        assert.equal(fixture.providers.length, 1);
        assert.equal(fixture.providers[0].nativeModule, fixture.bridge);
        assert.equal(fixture.providers[0].RTCPeerConnection, fixture.PeerConnection);
        assert.equal(fixture.providers[0].platform, platform);
        assert.deepEqual(fixture.counts(), { loads: 1, inits: 0 });
    }
});

test('registration failures restore existing entropy and do not leave Olm advertised', () => {
    for (const options of [{ olmFailure: true }, { api: { registerNativeE2EE() { throw Error('mismatch'); } } },
        { entropy: { getRandomBase64() { throw Error('synchronous bridge unavailable'); } } }]) {
        const fixture = registration(options);
        assert.equal(fixture.exports.registerNativeE2EERuntime(fixture.api), false);
        assert.equal(fixture.context.crypto.getRandomValues, fixture.originalEntropy);
        assert.equal(fixture.context.Olm, undefined);
        assert.equal(fixture.providers.length, 0);
    }
});

test('secure entropy preserves typed-array boundaries and restores previous implementation', () => {
    const previous = () => assert.fail('insecure fallback');
    const global = { crypto: { getRandomValues: previous } };
    const restore = runtime.installSecureEntropy(global, {
        getRandomBase64: count => Buffer.alloc(count, 0x42).toString('base64')
    }, decode);
    const buffer = new Uint8Array(12).fill(0x19);
    const view = new Uint16Array(buffer.buffer, 2, 3);
    assert.equal(global.crypto.getRandomValues(view), view);
    assert.deepEqual([...buffer], [0x19, 0x19, 0x42, 0x42, 0x42, 0x42, 0x42, 0x42, 0x19, 0x19, 0x19, 0x19]);
    restore();
    assert.equal(global.crypto.getRandomValues, previous);
});

test('malformed native entropy cannot partially overwrite the destination or fall back', () => {
    for (const encoded of [undefined, '!!!!', 'AA==', 'AAAAAA==']) {
        const global = {};
        runtime.installSecureEntropy(global, { getRandomBase64: () => encoded }, decode);
        const bytes = new Uint8Array(3).fill(7);
        assert.throws(() => global.crypto.getRandomValues(bytes), /Invalid native entropy response/);
        assert.deepEqual([...bytes], [7, 7, 7]);
        assert.throws(() => global.crypto.getRandomValues(new Float32Array(1)), /Invalid native entropy request/);
        assert.throws(() => global.crypto.getRandomValues(new Uint8Array(65537)), /Invalid native entropy request/);
    }
});

test('native HKDF receives copied material once, matches known HKDF and wipes bridge arrays', async () => {
    let sent, returned;
    const platform = runtime.createNativeCrypto({ async jitsiE2EERatchet(bytes) {
        sent = bytes;
        returned = Array.from(new Uint8Array(crypto.hkdfSync('sha256', Buffer.from(bytes),
            Buffer.from('JFrameRatchetKey'), Buffer.alloc(0), 32)));
        return returned;
    } });
    const material = new Uint8Array(32).fill(3);
    const expected = crypto.hkdfSync('sha256', material, Buffer.from('JFrameRatchetKey'), Buffer.alloc(0), 32);
    const token = await platform.importKey(material);
    material.fill(9);
    assert.deepEqual(new Uint8Array(await platform.ratchet(token)), new Uint8Array(expected));
    assert.ok(sent.every(byte => byte === 0));
    assert.ok(returned.every(byte => byte === 0));
    assert.ok(material.every(byte => byte === 9));
    await assert.rejects(platform.ratchet(token), /consumed/);
});

test('native HKDF rejects invalid output and consumes the token on native failure', async () => {
    for (const output of [true, Array(31).fill(1), [...Array(31).fill(1), 256]]) {
        let sent;
        const platform = runtime.createNativeCrypto({ async jitsiE2EERatchet(bytes) { sent = bytes; return output; } });
        const token = await platform.importKey(new Uint8Array(32).fill(4));
        await assert.rejects(platform.ratchet(token), /Invalid native ratchet result/);
        await assert.rejects(platform.ratchet(token), /consumed/);
        assert.ok(sent.every(byte => byte === 0));
        if (Array.isArray(output)) assert.ok(output.every(byte => byte === 0));
    }
});

test('concurrent HKDF token reuse is rejected before a second native operation', async () => {
    let complete;
    const platform = runtime.createNativeCrypto({ jitsiE2EERatchet: () => new Promise(r => { complete = r; }) });
    await assert.rejects(platform.importKey(new Uint8Array(16)), /32-byte/);
    const token = await platform.importKey(new ArrayBuffer(32));
    const pending = platform.ratchet(token);
    await assert.rejects(platform.ratchet(token), /consumed/);
    complete(Array(32).fill(2));
    await pending;
});

test('unmodified packaged Olm performs real key exchange without WASM or a Worker', async () => {
    const context = vm.createContext({ ...globals, module: { exports: {} }, exports: {} });
    vm.runInContext('window = globalThis; WebAssembly = undefined; Worker = undefined;', context);
    let requests = 0;
    runtime.installSecureEntropy(context, { getRandomBase64: count => {
        requests++;
        return crypto.randomBytes(count).toString('base64');
    } }, decode);
    context.require = () => assert.fail('Node-only Olm import executed');
    vm.runInContext(fs.readFileSync(require.resolve('@matrix-org/olm/olm_legacy.js'), 'utf8'), context, { timeout: 10000 });
    const olm = context.module.exports;
    await olm.init();
    const alice = new olm.Account(), bob = new olm.Account();
    const outgoing = new olm.Session(), incoming = new olm.Session();
    try {
        alice.create(); bob.create(); bob.generate_one_time_keys(1);
        outgoing.create_outbound(alice, JSON.parse(bob.identity_keys()).curve25519,
            Object.values(JSON.parse(bob.one_time_keys()).curve25519)[0]);
        const encrypted = outgoing.encrypt('SDK native runtime regression');
        incoming.create_inbound(bob, encrypted.body);
        assert.equal(incoming.decrypt(encrypted.type, encrypted.body), 'SDK native runtime regression');
        assert.ok(requests > 0);
    } finally {
        incoming.free(); outgoing.free(); alice.free(); bob.free();
    }
});
