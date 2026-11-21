const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((done, fail) => { resolve = done; reject = fail; });

    return { promise, resolve, reject };
}

function fixture() {
    const events = [];
    const native = { owner: 'view', revision: 1, sessionId: 0, nextId: 0, choice: 'none' };
    const props = { backgroundOwnerId: 'view', backgroundOwnerRevision: 1 };
    const state = { 'features/base/app': { app: { props } }, 'features/base/jwt': { jwt: '' } };
    const store = { getState: () => state };
    const bridge = {
        async freeze(owner, revision) {
            events.push('freeze');
            if (native.owner === owner && native.revision === revision) {
                native.sessionId = 0;
            }
        },
        async beginSession(owner, revision) {
            assert.equal(owner, native.owner);
            assert.equal(revision, native.revision);
            native.sessionId = ++native.nextId;
            native.choice = 'none';
            events.push(`begin:${native.sessionId}`);

            return { sessionId: native.sessionId };
        },
        async endSession(owner, revision, sessionId) {
            events.push(`end:${sessionId}`);
            if (owner === native.owner && revision === native.revision && native.sessionId === sessionId) {
                native.sessionId = 0;
            }
        }
    };
    const exports = {};
    const source = fs.readFileSync(path.resolve(__dirname,
        '../../react/features/virtual-background/lifecycle.native.ts'), 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText;

    vm.runInNewContext(compiled, {
        exports,
        require(name) {
            if (name === './bridge') {
                return { getBackgroundEffects: () => bridge };
            }
            if (name === '../app/logger') {
                return { default: { error: () => events.push('error') } };
            }
            throw new Error(`Unexpected runtime dependency: ${name}`);
        }
    });

    store.dispatch = action => typeof action === 'function' ? action(store.dispatch, store.getState) : action;

    function connectionActions(disconnect, customerDetails) {
        const actions = {};
        const source = fs.readFileSync(path.resolve(__dirname,
            '../../react/features/base/connection/actions.native.ts'), 'utf8');
        const compiled = ts.transpileModule(source, {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
        }).outputText;
        const modules = {
            '../../app/actions.native': { appNavigate: () => () => {} },
            '../../jaas/actions.any': { getCustomerDetails: () => () => customerDetails?.promise },
            '../../jaas/functions': {
                getJaasJWT: async () => 'jwt',
                isVpaasMeeting: () => Boolean(customerDetails)
            },
            '../../mobile/navigation/rootNavigationContainerRef': { replaceRoot: () => {} },
            '../../mobile/navigation/routes': { screen: { visitorsQueue: 'queue' } },
            '../../virtual-background/lifecycle': exports,
            '../jwt/actions': { setJWT: () => ({ type: 'SET_JWT' }) },
            '../lib-jitsi-meet': { JitsiConnectionErrors: { NOT_LIVE_ERROR: 'not live' } },
            './actions.any': { disconnect: (isRedirect, shouldLeave) => () => disconnect(isRedirect, shouldLeave) },
            './actions.native': {
                _connectInternal: () => () => { events.push('connect'); return Promise.resolve(); }
            },
            './logger': { default: { error: () => events.push('error') } }
        };

        vm.runInNewContext(compiled, {
            exports: actions,
            require(name) {
                assert.ok(Object.hasOwn(modules, name), `Unexpected connection dependency: ${name}`);

                return modules[name];
            }
        });

        return actions;
    }

    return { lifecycle: exports, store, native, props, bridge, events, connectionActions };
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('scope starts only after old disconnect; prejoin connect preserves selection', async () => {
    const f = fixture();
    const leave = deferred();
    const navigation = f.lifecycle.beginBackgroundNavigation(f.store, async () => {
        f.events.push('disconnect');
        await leave.promise;
    });

    await tick();
    assert.deepEqual(f.events, [ 'freeze', 'disconnect' ]);
    assert.equal(f.native.sessionId, 0);
    leave.resolve();
    const isCurrent = await navigation;

    assert.equal(isCurrent(), true);
    assert.equal(f.native.sessionId, 1);
    f.native.choice = 'blur';
    assert.equal(await f.lifecycle.ensureBackgroundSession(f.store), true);
    assert.equal(f.native.choice, 'blur');
    assert.deepEqual(f.events, [ 'freeze', 'disconnect', 'begin:1' ]);
});

test('superseded navigation finishes old disconnect before activating the latest scope', async () => {
    const f = fixture();
    const leave = deferred();
    const first = f.lifecycle.beginBackgroundNavigation(f.store, () => leave.promise);

    await tick();
    const second = f.lifecycle.beginBackgroundNavigation(f.store, async () => {
        f.events.push('disconnect:second');
    });

    await tick();
    assert.equal(f.native.sessionId, 0);
    assert.deepEqual(f.events, [ 'freeze' ]);
    leave.resolve();
    assert.equal((await first)(), false);
    assert.equal((await second)(), true);
    assert.deepEqual(f.events, [ 'freeze', 'freeze', 'disconnect:second', 'begin:1' ]);
});

test('late old leave cannot close the new room; JS-only rejoin gets a clean scope', async () => {
    const f = fixture();
    const oldConference = {};
    const newConference = {};

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    f.lifecycle.bindBackgroundConference(f.store, oldConference);
    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    f.lifecycle.bindBackgroundConference(f.store, newConference);
    await f.lifecycle.endBackgroundConference(f.store, oldConference);
    assert.equal(f.native.sessionId, 2);
    f.native.choice = 'blur';
    await f.lifecycle.endBackgroundConference(f.store, newConference);
    assert.equal(f.native.sessionId, 0);
    await f.lifecycle.ensureBackgroundSession(f.store);
    assert.equal(f.native.sessionId, 3);
    assert.equal(f.native.choice, 'none');
});

test('prejoin cancellation rotates the preview scope without needing a conference event', async () => {
    const f = fixture();

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    f.native.choice = 'blur';
    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    assert.equal(f.native.sessionId, 2);
    assert.equal(f.native.choice, 'none');
});

test('visitor redirect preserves the logical meeting scope', async () => {
    const f = fixture();
    const oldConference = {};

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    f.native.choice = 'blur';
    f.lifecycle.bindBackgroundConference(f.store, oldConference);
    await f.lifecycle.endBackgroundConference(f.store, oldConference, true);
    await f.lifecycle.endBackgroundConference(f.store, oldConference);
    await f.lifecycle.ensureBackgroundSession(f.store);
    assert.equal(f.native.sessionId, 1);
    assert.equal(f.native.choice, 'blur');
});

test('same-room no-op remains valid until native leave changes the owner revision', async () => {
    const f = fixture();

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    assert.equal(f.lifecycle.hasBackgroundSession(f.store), true);
    f.native.revision = 2;
    f.native.sessionId = 0;
    f.props.backgroundOwnerRevision = 2;
    assert.equal(f.lifecycle.hasBackgroundSession(f.store), false);
    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    assert.equal(f.lifecycle.hasBackgroundSession(f.store), true);
});

test('native leave revision cancels a pending activation while warm tracks keep their owner', async () => {
    const f = fixture();
    const leave = deferred();
    const oldNavigation = f.lifecycle.beginBackgroundNavigation(f.store, () => leave.promise);

    await tick();
    f.native.revision = 2;
    f.props.backgroundOwnerRevision = 2;
    const newNavigation = f.lifecycle.beginBackgroundNavigation(f.store, async () => {});

    leave.resolve();
    assert.equal((await oldNavigation)(), false);
    assert.equal((await newNavigation)(), true);
    assert.equal(f.native.owner, 'view');
    assert.equal(f.native.sessionId, 1);
});

test('unmount prevents pending navigation from reopening capture', async () => {
    const f = fixture();
    const leave = deferred();
    const navigation = f.lifecycle.beginBackgroundNavigation(f.store, () => leave.promise);

    await tick();
    await f.lifecycle.disposeBackgroundScope(f.store);
    leave.resolve();
    assert.equal((await navigation)(), false);
    assert.equal(await f.lifecycle.ensureBackgroundSession(f.store), false);
    assert.equal(f.native.sessionId, 0);
    assert.equal(f.native.nextId, 0);
});

test('failed freeze does not disconnect or activate a raw replacement scope', async () => {
    const f = fixture();

    f.bridge.freeze = async () => { throw new Error('bridge unavailable'); };
    await assert.rejects(f.lifecycle.beginBackgroundNavigation(f.store, async () => {
        assert.fail('disconnect must wait for native freeze');
    }), /bridge unavailable/);
    assert.equal(f.native.nextId, 0);
});

test('failed disconnect keeps direct reconnect from activating an unprotected scope', async () => {
    const f = fixture();

    await assert.rejects(f.lifecycle.beginBackgroundNavigation(f.store, async () => {
        throw new Error('old conference still connected');
    }), /old conference still connected/);
    assert.equal(await f.lifecycle.ensureBackgroundSession(f.store), false);
    assert.equal(f.native.sessionId, 0);
    assert.equal(f.native.nextId, 0);
    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    assert.equal(f.native.sessionId, 1);
});


test('native connect waits for an unawaited disconnect before activating its replacement scope', async () => {
    const f = fixture();
    const conference = {};
    const leave = deferred();

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    f.lifecycle.bindBackgroundConference(f.store, conference);
    const actions = f.connectionActions(async () => {
        await f.lifecycle.endBackgroundConference(f.store, conference);
        await leave.promise;
    });
    const disconnect = f.store.dispatch(actions.disconnect());
    const connect = f.store.dispatch(actions.connect());

    await tick();
    assert.equal(f.native.sessionId, 0);
    assert.equal(f.native.nextId, 1);
    assert.equal(f.events.includes('connect'), false);
    leave.resolve();
    await disconnect;
    await connect;
    assert.equal(f.native.sessionId, 2);
    assert.equal(f.events.filter(event => event === 'connect').length, 1);
});

test('a failed unawaited native disconnect blocks current and later direct connects', async () => {
    const f = fixture();
    const conference = {};
    const leave = deferred();

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    f.lifecycle.bindBackgroundConference(f.store, conference);
    const actions = f.connectionActions(async () => {
        await f.lifecycle.endBackgroundConference(f.store, conference);
        await leave.promise;
    });
    const disconnect = f.store.dispatch(actions.disconnect());
    const connect = f.store.dispatch(actions.connect());

    leave.reject(new Error('disconnect failed'));
    await assert.rejects(disconnect, /disconnect failed/);
    await connect;
    await f.store.dispatch(actions.connect());
    assert.equal(f.native.sessionId, 0);
    assert.equal(f.native.nextId, 1);
    assert.equal(f.events.includes('connect'), false);
});

test('navigation can await its wrapped disconnect without queue deadlock or duplicate activation',
    { timeout: 1000 }, async () => {
        const f = fixture();
        const conference = {};
        const leave = deferred();
        let disconnectCalls = 0;

        await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
        f.lifecycle.bindBackgroundConference(f.store, conference);
        const actions = f.connectionActions(async () => {
            disconnectCalls += 1;
            await f.lifecycle.endBackgroundConference(f.store, conference);
            await leave.promise;
        });
        const disconnect = f.store.dispatch(actions.disconnect());
        const navigation = f.lifecycle.beginBackgroundNavigation(f.store,
            () => f.store.dispatch(actions.disconnect()));
        const connect = f.store.dispatch(actions.connect());

        await tick();
        assert.equal(disconnectCalls, 1);
        leave.resolve();
        await disconnect;
        assert.equal((await navigation)(), true);
        await connect;
        assert.equal(f.native.nextId, 2);
        assert.equal(f.native.sessionId, 2);
        assert.equal(f.events.filter(event => event === 'connect').length, 1);
    });

test('visitor redirect reconnect waits for disconnect and preserves the selected effect', async () => {
    const f = fixture();
    const conference = {};
    const leave = deferred();

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    f.native.choice = 'blur';
    f.lifecycle.bindBackgroundConference(f.store, conference);
    const actions = f.connectionActions(async isRedirect => {
        await f.lifecycle.endBackgroundConference(f.store, conference, isRedirect);
        await leave.promise;
    });
    const disconnect = f.store.dispatch(actions.disconnect(true));
    const connect = f.store.dispatch(actions.connect());

    await tick();
    assert.equal(f.events.includes('connect'), false);
    assert.equal(f.native.choice, 'blur');
    leave.resolve();
    await disconnect;
    await connect;
    assert.equal(f.native.sessionId, 1);
    assert.equal(f.native.nextId, 1);
    assert.equal(f.native.choice, 'blur');
});

test('disposing an owner while native disconnect is pending prevents its queued connect', async () => {
    const f = fixture();
    const leave = deferred();

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    const actions = f.connectionActions(() => leave.promise);
    const disconnect = f.store.dispatch(actions.disconnect());
    const connect = f.store.dispatch(actions.connect());

    await tick();
    await f.lifecycle.disposeBackgroundScope(f.store);
    leave.resolve();
    await disconnect;
    await connect;
    assert.equal(f.native.sessionId, 0);
    assert.equal(f.native.nextId, 1);
    assert.equal(f.events.includes('connect'), false);
});

test('a delayed authenticated connect cannot revive a superseded navigation', async () => {
    const f = fixture();
    const details = deferred();

    await f.lifecycle.beginBackgroundNavigation(f.store, async () => {});
    const actions = f.connectionActions(async () => {}, details);
    const connect = f.store.dispatch(actions.connect());

    await tick();
    await f.lifecycle.beginBackgroundNavigation(f.store, () => f.store.dispatch(actions.disconnect()));
    details.resolve();
    await connect;
    assert.equal(f.native.sessionId, 2);
    assert.equal(f.native.nextId, 2);
    assert.equal(f.events.includes('connect'), false);
});

test('synchronous native disconnect failure keeps activation blocked until an explicit successful retry', async () => {
    const f = fixture();
    const actions = f.connectionActions(() => { throw new Error('synchronous disconnect failure'); });

    await assert.rejects(f.store.dispatch(actions.disconnect()), /synchronous disconnect failure/);
    await f.store.dispatch(actions.connect());
    assert.equal(f.native.nextId, 0);
    const retry = f.connectionActions(async () => {});

    await f.store.dispatch(retry.disconnect());
    await f.store.dispatch(retry.connect());
    assert.equal(f.native.nextId, 1);
    assert.equal(f.events.filter(event => event === 'connect').length, 1);
});
