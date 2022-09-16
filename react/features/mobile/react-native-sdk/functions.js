import { NativeModules } from 'react-native';

import { appNavigate } from '../../app/actions.native';

/**
 * Determimes if the ExternalAPI native module is available.
 *
 * @returns {boolean} If yes {@code true} otherwise {@code false}.
 */
export function isExternalAPIAvailable() {
    const { ExternalAPI } = NativeModules;

    if (ExternalAPI === null) {
        return false;
    }

    return true;
}

/**
 * Dispatches a READY_TO_CLOSE event from an arbitrary component.
 * Created to enable triggering READY_TO_CLOSE from a SDK component.
 *
 * @param {Function} dispatch - The dispatch function.
 * @returns {void}
 */
export function closeJitsiMeeting(dispatch) {
    dispatch(appNavigate(undefined));
}
