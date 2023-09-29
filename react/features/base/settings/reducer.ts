// @ts-expect-error
import { jitsiLocalStorage } from '@jitsi/js-utils';
import _ from 'lodash';

import { APP_WILL_MOUNT } from '../app/actionTypes';
import PersistenceRegistry from '../redux/PersistenceRegistry';
import ReducerRegistry from '../redux/ReducerRegistry';
import { assignIfDefined } from '../util/helpers';

import { SETTINGS_UPDATED } from './actionTypes';

/**
 * The default/initial redux state of the feature {@code base/settings}.
 *
 * @type Object
 */
const DEFAULT_STATE: ISettingsState = {
    audioOutputDeviceId: undefined,
    avatarURL: undefined,
    cameraDeviceId: undefined,
    disableCallIntegration: undefined,
    disableCrashReporting: undefined,
    disableP2P: undefined,
    disableSelfView: false,
    displayName: undefined,
    email: undefined,
    localFlipX: true,
    maxStageParticipants: 1,
    micDeviceId: undefined,
    serverURL: undefined,
    hideShareAudioHelper: false,
    soundsIncomingMessage: true,
    soundsParticipantJoined: true,
    soundsParticipantKnocking: true,
    soundsParticipantLeft: true,
    soundsTalkWhileMuted: true,
    soundsReactions: true,
    startAudioOnly: false,
    startCarMode: false,
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    userSelectedAudioOutputDeviceId: undefined,
    userSelectedCameraDeviceId: undefined,
    userSelectedMicDeviceId: undefined,
    userSelectedAudioOutputDeviceLabel: undefined,
    userSelectedCameraDeviceLabel: undefined,
    userSelectedNotifications: {
        'notify.chatMessages': true
    },
    userSelectedMicDeviceLabel: undefined,
    userSelectedSkipPrejoin: undefined
};

export interface ISettingsState {
    audioOutputDeviceId?: string;
    audioSettingsVisible?: boolean;
    avatarURL?: string;
    cameraDeviceId?: string | boolean;
    disableCallIntegration?: boolean;
    disableCrashReporting?: boolean;
    disableP2P?: boolean;
    disableSelfView?: boolean;
    displayName?: string;
    email?: string;
    hideShareAudioHelper?: boolean;
    localFlipX?: boolean;
    maxStageParticipants?: number;
    micDeviceId?: string | boolean;
    serverURL?: string;
    soundsIncomingMessage?: boolean;
    soundsParticipantJoined?: boolean;
    soundsParticipantKnocking?: boolean;
    soundsParticipantLeft?: boolean;
    soundsReactions?: boolean;
    soundsTalkWhileMuted?: boolean;
    startAudioOnly?: boolean;
    startCarMode?: boolean;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    userSelectedAudioOutputDeviceId?: string;
    userSelectedAudioOutputDeviceLabel?: string;
    userSelectedCameraDeviceId?: string;
    userSelectedCameraDeviceLabel?: string;
    userSelectedMicDeviceId?: string;
    userSelectedMicDeviceLabel?: string;
    userSelectedNotifications?: {
        [key: string]: boolean;
    };
    userSelectedSkipPrejoin?: boolean;
    videoSettingsVisible?: boolean;
    visible?: boolean;
}

const STORE_NAME = 'features/base/settings';

/**
 * Sets up the persistence of the feature {@code base/settings}.
 */
const filterSubtree: ISettingsState = {};

// start with the default state
Object.keys(DEFAULT_STATE).forEach(key => {
    const key1 = key as keyof typeof filterSubtree;

    // @ts-ignore
    filterSubtree[key1] = true;
});

// we want to filter these props, to not be stored as they represent
// what is currently opened/used as devices
// @ts-ignore
filterSubtree.audioOutputDeviceId = false;
filterSubtree.cameraDeviceId = false;
filterSubtree.micDeviceId = false;

PersistenceRegistry.register(STORE_NAME, filterSubtree, DEFAULT_STATE);

ReducerRegistry.register<ISettingsState>(STORE_NAME, (state = DEFAULT_STATE, action): ISettingsState => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        return _initSettings(state);

    case SETTINGS_UPDATED:
        return {
            ...state,
            ...action.settings
        };
    }

    return state;
});

/**
 * Inits the settings object based on what information we have available.
 * Info taken into consideration:
 *   - Old Settings.js style data.
 *
 * @private
 * @param {ISettingsState} featureState - The current state of the feature.
 * @returns {Object}
 */
function _initSettings(featureState: ISettingsState) {
    let settings = featureState;

    // Old Settings.js values
    // FIXME: jibri uses old settings.js local storage values to set its display
    // name and email. Provide another way for jibri to set these values, update
    // jibri, and remove the old settings.js values.
    const savedDisplayName = jitsiLocalStorage.getItem('displayname');
    const savedEmail = jitsiLocalStorage.getItem('email');

    // The helper _.escape will convert null to an empty strings. The empty
    // string will be saved in settings. On app re-load, because an empty string
    // is a defined value, it will override any value found in local storage.
    // The workaround is sidestepping _.escape when the value is not set in
    // local storage.
    const displayName = savedDisplayName === null ? undefined : _.escape(savedDisplayName);
    const email = savedEmail === null ? undefined : _.escape(savedEmail);

    settings = assignIfDefined({
        displayName,
        email
    }, settings);

    return settings;
}
