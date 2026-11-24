import { describe, expect, it, vi } from 'vitest';

import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_PREJOIN_DEVICE_ERRORS } from './actionTypes';
import './reducer';

vi.mock('../base/redux/PersistenceRegistry', () => ({ default: { register: vi.fn() } }));
vi.mock('../device-permissions/functions', () => ({
    isPermissionDenied: (error?: { name?: string; }) => error?.name === 'gum.permission_denied'
}));

const denied = { message: 'Permission denied', name: 'gum.permission_denied' };
const failed = { message: 'Could not start video source', name: 'gum.general' };

/**
 * Returns the pre-join device status for the errors of the initial tracks.
 *
 * @param {Object} errors - The errors.
 * @returns {string}
 */
function statusFor(errors: object) {
    const state = ReducerRegistry.combineReducers()(undefined, {
        type: SET_PREJOIN_DEVICE_ERRORS,
        value: errors
    });

    return state['features/prejoin'].deviceStatusText;
}

describe('prejoin device status', () => {
    it.each([
        [ 'a denied camera', { videoOnlyError: denied }, 'prejoin.errorNoCameraPermission' ],
        [ 'a denied microphone', { audioOnlyError: denied }, 'prejoin.errorNoMicPermission' ],
        [ 'both denied', { audioAndVideoError: denied, audioOnlyError: denied, videoOnlyError: denied },
            'prejoin.errorNoPermissions' ],
        [ 'a camera that fails', { videoOnlyError: failed }, 'deviceError.cameraError' ],
        [ 'a microphone that fails', { audioOnlyError: failed }, 'deviceError.microphoneError' ],
        [ 'both failing, one of them denied', { audioAndVideoError: failed, audioOnlyError: denied, videoOnlyError: failed },
            'prejoin.devicesError' ],
        [ 'no errors', {}, 'prejoin.lookGood' ]
    ])('names the problem for %s', (_, errors, text) => {
        expect(statusFor(errors)).toBe(text);
    });
});
