// @flow

import { NativeModules } from 'react-native';

import { getAppProp } from '../../base/app';
import { destroyLocalTracks } from '../../base/tracks/actions';

import { CONFERENCE_TERMINATED } from './constants';

/**
 * Sends a specific event to the native counterpart of the External API. Native
 * apps may listen to such events via the mechanisms provided by the (native)
 * mobile Jitsi Meet SDK.
 *
 * @param {Object} store - The redux store.
 * @param {string} name - The name of the event to send.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code name}.
 * @returns {void}
 */
export async function sendEvent(store: Object, name: string, data: Object) {
    // The JavaScript App needs to provide uniquely identifying information to
    // the native ExternalAPI module so that the latter may match the former to
    // the native view which hosts it.
    const externalAPIScope = getAppProp(store, 'externalAPIScope');

    if (!externalAPIScope) {
        return;
    }

    if (name === CONFERENCE_TERMINATED) {
        const { enableWelcomePage } = store.getState()['features/base/config'];

        if (!enableWelcomePage) {
            await store.dispatch(destroyLocalTracks());
        }
    }

    NativeModules.ExternalAPI.sendEvent(name, data, externalAPIScope);
}
