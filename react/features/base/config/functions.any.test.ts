// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IReduxState } from '../../app/types';

import { IConfig } from './configType';
import { getPageUnloadEventName, setConfigFromURLParams } from './functions.any';

vi.mock('../lib-jitsi-meet', () => ({}));
vi.mock('../participants/functions', () => ({}));

const { isEmbeddedMock } = vi.hoisted(() => ({ isEmbeddedMock: vi.fn(() => false) }));

vi.mock('../util/embedUtils', () => ({ isEmbedded: isEmbeddedMock }));

/**
 * Builds the part of the redux state that the config selectors read.
 *
 * @param {IConfig} config - The config of the client.
 * @returns {IReduxState}
 */
function stateWithConfig(config: IConfig) {
    return { 'features/base/config': config } as unknown as IReduxState;
}

describe('getPageUnloadEventName', () => {
    it('runs the cleanup on beforeunload by default', () => {
        expect(getPageUnloadEventName(stateWithConfig({}))).toBe('beforeunload');
        expect(getPageUnloadEventName(stateWithConfig({ disableBeforeUnloadHandlers: false }))).toBe('beforeunload');
    });

    it('runs the cleanup on pagehide when the beforeunload handlers are disabled', () => {
        // Not on unload: browsers no longer fire it, so the cleanup would never run.
        expect(getPageUnloadEventName(stateWithConfig({ disableBeforeUnloadHandlers: true }))).toBe('pagehide');
    });
});

describe('setConfigFromURLParams - prejoinConfig.enabled', () => {
    beforeEach(() => {
        isEmbeddedMock.mockReturnValue(false);
    });

    /**
     * Applies a hash to a config and returns the resulting config.
     *
     * @param {string} hash - The hash part of the URL.
     * @param {IConfig} initial - The config before the URL overrides are applied.
     * @returns {IConfig}
     */
    function applyHash(hash: string, initial: IConfig = {}) {
        const config: IConfig = initial;

        setConfigFromURLParams(config, undefined, `https://example.com/room${hash}`);

        return config;
    }

    it.each([
        [ 'false', '#config.prejoinConfig.enabled=false', false ],
        [ '0', '#config.prejoinConfig.enabled=0', 0 ],
        [ '-0', '#config.prejoinConfig.enabled=-0', -0 ],
        [ 'an empty string', '#config.prejoinConfig.enabled=%22%22', '' ],
        [ 'a nested object with false', '#config.prejoinConfig=%7B%22enabled%22%3Afalse%7D', false ],
        [ 'a nested object with 0', '#config.prejoinConfig=%7B%22enabled%22%3A0%7D', 0 ]
    ])('starts without media when the pre-join page is turned off with %s', (_name, hash, expected) => {
        const config = applyHash(hash);

        expect(config.prejoinConfig?.enabled).toBe(expected);
        expect(config.disableInitialGUM).toBe(true);
    });

    it.each([
        [ 'true', '#config.prejoinConfig.enabled=true', true ],
        [ '1', '#config.prejoinConfig.enabled=1', 1 ],
        [ '-1', '#config.prejoinConfig.enabled=-1', -1 ],
        [ 'null', '#config.prejoinConfig.enabled=null', null ],
        [ 'a non-empty string', '#config.prejoinConfig.enabled=%22false%22', 'false' ],
        [ 'a quoted zero', '#config.prejoinConfig.enabled=%220%22', '0' ],
        [ 'an empty array', '#config.prejoinConfig.enabled=%5B%5D', [] ],
        [ 'an empty object', '#config.prejoinConfig.enabled=%7B%7D', {} ]
    ])('does not change the initial media when the pre-join page stays on (%s)', (_name, hash, expected) => {
        const config = applyHash(hash);

        expect(config.prejoinConfig?.enabled).toEqual(expected);
        expect(config.disableInitialGUM).toBeUndefined();
    });

    it('does not change the initial media when there is no override', () => {
        expect(applyHash('').disableInitialGUM).toBeUndefined();
    });

    describe('when the config already has the pre-join page turned off', () => {
        const initial = () => ({ prejoinConfig: { enabled: false } }) as IConfig;

        it('does not change the initial media for an unrelated override', () => {
            expect(applyHash('#config.prejoinConfig.hideDisplayName=true', initial()).disableInitialGUM)
                .toBeUndefined();
            expect(applyHash('#config.startWithAudioMuted=true', initial()).disableInitialGUM).toBeUndefined();
        });

        it('does not change the initial media when the override is undefined', () => {
            expect(applyHash('#config.prejoinConfig.enabled=undefined', initial()).disableInitialGUM)
                .toBeUndefined();
        });

        it('does not change the initial media when the override turns the pre-join page back on', () => {
            expect(applyHash('#config.prejoinConfig.enabled=null', initial()).disableInitialGUM).toBeUndefined();
            expect(applyHash('#config.prejoinConfig.enabled=true', initial()).disableInitialGUM).toBeUndefined();
        });

        it('starts without media when the override repeats the falsy value', () => {
            expect(applyHash('#config.prejoinConfig.enabled=0', initial()).disableInitialGUM).toBe(true);
        });
    });

    it('does not change the initial media when embedded', () => {
        isEmbeddedMock.mockReturnValue(true);

        expect(applyHash('#config.prejoinConfig.enabled=0').disableInitialGUM).toBeUndefined();
        expect(applyHash('#config.prejoinConfig.enabled=false').disableInitialGUM).toBeUndefined();
    });
});
