// @flow

import { jitsiLocalStorage } from 'js-utils';
import { randomHexString } from 'js-utils/random';
import _ from 'lodash';

import { APP_WILL_MOUNT } from '../app';
import { browser } from '../lib-jitsi-meet';
import { ReducerRegistry } from '../redux';
import { PersistenceRegistry } from '../storage';
import { assignIfDefined } from '../util';

import { SETTINGS_UPDATED } from './actionTypes';
import logger from './logger';

/**
 * The default/initial redux state of the feature {@code base/settings}.
 *
 * @type Object
 */
const DEFAULT_STATE = {
    audioOutputDeviceId: undefined,
    avatarID: undefined,
    avatarURL: undefined,
    cameraDeviceId: undefined,
    disableCallIntegration: undefined,
    disableCrashReporting: undefined,
    disableP2P: undefined,
    displayName: undefined,
    email: undefined,
    localFlipX: true,
    micDeviceId: undefined,
    serverURL: undefined,
    startAudioOnly: false,
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    userSelectedAudioOutputDeviceId: undefined,
    userSelectedCameraDeviceId: undefined,
    userSelectedMicDeviceId: undefined,
    userSelectedAudioOutputDeviceLabel: undefined,
    userSelectedCameraDeviceLabel: undefined,
    userSelectedMicDeviceLabel: undefined,
    userSelectedSkipPrejoin: undefined
};

const STORE_NAME = 'features/base/settings';

/**
 * Sets up the persistence of the feature {@code base/settings}.
 */
const filterSubtree = {};

// start with the default state
Object.keys(DEFAULT_STATE).forEach(key => {
    filterSubtree[key] = true;
});

// we want to filter these props, to not be stored as they represent
// what is currently opened/used as devices
filterSubtree.audioOutputDeviceId = false;
filterSubtree.cameraDeviceId = false;
filterSubtree.micDeviceId = false;

PersistenceRegistry.register(STORE_NAME, filterSubtree);

ReducerRegistry.register(STORE_NAME, (state = DEFAULT_STATE, action) => {
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
 * Retrieves the legacy profile values regardless of it's being in pre or
 * post-flattening format.
 *
 * FIXME: Let's remove this after a predefined time (e.g. By July 2018) to avoid
 * garbage in the source.
 *
 * @private
 * @returns {Object}
 */
function _getLegacyProfile() {
    let persistedProfile = jitsiLocalStorage.getItem('features/base/profile');

    if (persistedProfile) {
        try {
            persistedProfile = JSON.parse(persistedProfile);

            if (persistedProfile && typeof persistedProfile === 'object') {
                const preFlattenedProfile = persistedProfile.profile;

                return preFlattenedProfile || persistedProfile;
            }
        } catch (e) {
            logger.warn('Error parsing persisted legacy profile', e);
        }
    }

    return {};
}

/**
 * Inits the settings object based on what information we have available.
 * Info taken into consideration:
 *   - Old Settings.js style data
 *   - Things that we stored in profile earlier but belong here.
 *
 * @private
 * @param {Object} featureState - The current state of the feature.
 * @returns {Object}
 */
function _initSettings(featureState) {
    let settings = featureState;

    // Old Settings.js values
    // FIXME: jibri uses old settings.js local storage values to set its display
    // name and email. Provide another way for jibri to set these values, update
    // jibri, and remove the old settings.js values.
    const savedDisplayName = jitsiLocalStorage.getItem('displayname');
    const savedEmail = jitsiLocalStorage.getItem('email');
    let avatarID = _.escape(jitsiLocalStorage.getItem('avatarId'));

    // The helper _.escape will convert null to an empty strings. The empty
    // string will be saved in settings. On app re-load, because an empty string
    // is a defined value, it will override any value found in local storage.
    // The workaround is sidestepping _.escape when the value is not set in
    // local storage.
    const displayName
        = savedDisplayName === null ? undefined : _.escape(savedDisplayName);
    const email = savedEmail === null ? undefined : _.escape(savedEmail);

    if (!avatarID) {
        // if there is no avatar id, we generate a unique one and use it forever
        avatarID = randomHexString(32);
    }

    settings = assignIfDefined({
        avatarID,
        displayName,
        email
    }, settings);

    if (!browser.isReactNative()) {
        // Browser only
        const localFlipX = JSON.parse(jitsiLocalStorage.getItem('localFlipX') || 'true');
        const cameraDeviceId = jitsiLocalStorage.getItem('cameraDeviceId') || '';
        const micDeviceId = jitsiLocalStorage.getItem('micDeviceId') || '';

        // Currently audio output device change is supported only in Chrome and
        // default output always has 'default' device ID
        const audioOutputDeviceId = jitsiLocalStorage.getItem('audioOutputDeviceId') || 'default';

        settings = assignIfDefined({
            audioOutputDeviceId,
            cameraDeviceId,
            localFlipX,
            micDeviceId
        }, settings);
    }

    // Things we stored in profile earlier
    const legacyProfile = _getLegacyProfile();

    settings = assignIfDefined(legacyProfile, settings);

    return settings;
}
