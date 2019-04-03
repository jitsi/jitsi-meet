// @flow

import { randomHexString } from 'js-utils/random';
import _ from 'lodash';

import { APP_WILL_MOUNT } from '../app';
import { browser } from '../lib-jitsi-meet';
import { ReducerRegistry } from '../redux';
import { PersistenceRegistry } from '../storage';
import { assignIfDefined } from '../util';

import { SETTINGS_UPDATED } from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
    displayName: undefined,
    email: undefined,
    localFlipX: true,
    micDeviceId: undefined,
    serverURL: undefined,
    startAudioOnly: false,
    startWithAudioMuted: false,
    startWithVideoMuted: false
};

const STORE_NAME = 'features/base/settings';

/**
 * Sets up the persistence of the feature {@code base/settings}.
 */
PersistenceRegistry.register(STORE_NAME);

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
    let persistedProfile
        = window.localStorage.getItem('features/base/profile');

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
    // FIXME: Let's remove this after a predefined time (e.g. by July 2018) to
    // avoid garbage in the source.
    const displayName = _.escape(window.localStorage.getItem('displayname'));
    const email = _.escape(window.localStorage.getItem('email'));
    let avatarID = _.escape(window.localStorage.getItem('avatarId'));

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
        const localFlipX
            = JSON.parse(window.localStorage.getItem('localFlipX') || 'true');
        const cameraDeviceId
            = window.localStorage.getItem('cameraDeviceId') || '';
        const micDeviceId = window.localStorage.getItem('micDeviceId') || '';

        // Currently audio output device change is supported only in Chrome and
        // default output always has 'default' device ID
        const audioOutputDeviceId
            = window.localStorage.getItem('audioOutputDeviceId') || 'default';

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
