// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';

import { IReduxState } from '../../app/types';

import { IConfig } from './configType';
import { getPageUnloadEventName } from './functions.any';

vi.mock('../lib-jitsi-meet', () => ({}));
vi.mock('../participants/functions', () => ({}));

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
