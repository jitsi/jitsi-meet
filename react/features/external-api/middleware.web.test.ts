// @vitest-environment happy-dom

import { createStore } from 'redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SET_CONFIG } from '../base/config/actionTypes';
import { IConfig } from '../base/config/configType';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import './middleware';

/**
 * The transport the middleware gets, in place of the real one that talks to the embedding page.
 */
const transport = vi.hoisted(() => ({ dispose: vi.fn() }));

vi.mock('../../../modules/transport', () => ({ getJitsiMeetTransport: () => transport }));
vi.mock('../base/lib-jitsi-meet', () => ({}));
vi.mock('../base/participants/functions', () => ({}));
vi.mock('../display-name/functions', () => ({}));
vi.mock('./subscriber', () => ({}));

/**
 * The name of the room the tests are in.
 */
const ROOM_NAME = 'testroom';

describe('external API cleanup when the page is left', () => {
    /**
     * The part of the external API that the cleanup uses.
     */
    const api = {
        dispose: vi.fn(),
        notifyConferenceLeft: vi.fn()
    };

    /**
     * Records the listeners the middleware adds to the window, so that they can be removed after each test.
     */
    const addEventListener = vi.spyOn(window, 'addEventListener');

    /**
     * Loads the given config into a new store, which is when the middleware registers the cleanup.
     *
     * @param {IConfig} config - The config of the client.
     * @returns {void}
     */
    function loadConfig(config: IConfig) {
        const store = createStore(() => ({ 'features/base/config': config }), MiddlewareRegistry.applyMiddleware());

        store.dispatch({
            type: SET_CONFIG,
            config
        });
    }

    /**
     * Fires pagehide as the browser does when the page is left.
     *
     * @param {boolean} persisted - Whether the page may go into the back/forward cache and be shown again.
     * @returns {void}
     */
    function hidePage(persisted: boolean) {
        window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted }));
    }

    beforeEach(() => {
        vi.stubGlobal('APP', {
            API: api,
            conference: { roomName: ROOM_NAME }
        });
    });

    afterEach(() => {
        // The middleware never removes its listeners. Left in place, they would also run in the next test.
        addEventListener.mock.calls.forEach(([ type, listener ]) => window.removeEventListener(type, listener));
        addEventListener.mockClear();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('keeps the API and the transport when the page may be restored from the back/forward cache', () => {
        loadConfig({ disableBeforeUnloadHandlers: true });

        hidePage(true);

        // The conference is left anyway, so the embedder is still told.
        expect(api.notifyConferenceLeft).toHaveBeenCalledExactlyOnceWith(ROOM_NAME);
        expect(api.dispose).not.toHaveBeenCalled();
        expect(transport.dispose).not.toHaveBeenCalled();
    });

    it('disposes the API and the transport when the page goes away for good', () => {
        loadConfig({ disableBeforeUnloadHandlers: true });

        hidePage(false);

        expect(api.notifyConferenceLeft).toHaveBeenCalledExactlyOnceWith(ROOM_NAME);
        expect(api.dispose).toHaveBeenCalledTimes(1);
        expect(transport.dispose).toHaveBeenCalledTimes(1);
    });

    it('disposes the API and the transport on beforeunload by default', () => {
        loadConfig({});

        window.dispatchEvent(new Event('beforeunload'));

        expect(api.notifyConferenceLeft).toHaveBeenCalledExactlyOnceWith(ROOM_NAME);
        expect(api.dispose).toHaveBeenCalledTimes(1);
        expect(transport.dispose).toHaveBeenCalledTimes(1);
    });
});
