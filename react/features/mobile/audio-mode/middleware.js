// @flow

import { NativeEventEmitter, NativeModules } from 'react-native';

import { SET_AUDIO_ONLY } from '../../base/audio-only';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_LEFT,
    CONFERENCE_JOINED,
    getCurrentConference
} from '../../base/conference';
import { getParticipantCount } from '../../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../../base/redux';

import { _SET_AUDIOMODE_DEVICES, _SET_AUDIOMODE_SUBSCRIPTIONS } from './actionTypes';
import logger from './logger';

const { AudioMode, RNCallKit } = NativeModules;
const AudioModeEmitter = new NativeEventEmitter(AudioMode);

/**
 * Middleware that captures conference actions and sets the correct audio mode
 * based on the type of conference. Audio-only conferences don't use the speaker
 * by default, and video conferences do.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    /* eslint-disable no-fallthrough */

    switch (action.type) {
    case _SET_AUDIOMODE_SUBSCRIPTIONS:
        _setSubscriptions(store);
        break;
    case APP_WILL_UNMOUNT: {
        store.dispatch({
            type: _SET_AUDIOMODE_SUBSCRIPTIONS,
            subscriptions: undefined
        });
        break;
    }
    case APP_WILL_MOUNT:
        _appWillMount(store);
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:

    /*
    * NOTE: We moved the audio mode setting from CONFERENCE_WILL_JOIN to
    * CONFERENCE_JOINED because in case of a locked room, the app goes
    * through CONFERENCE_FAILED state and gets to CONFERENCE_JOINED only
    * after a correct password, so we want to make sure we have the correct
    * audio mode set up when we finally get to the conf, but also make sure
    * that the app is in the right audio mode if the user leaves the
    * conference after the password prompt appears.
    */
    case CONFERENCE_JOINED:
    case SET_AUDIO_ONLY:
        return _updateAudioMode(store, next, action);

    }

    /* eslint-enable no-fallthrough */

    return next(action);
});

StateListenerRegistry.register(
    /* selector */ state => {
        const conference = getCurrentConference(state);
        const participantCount = getParticipantCount(state);

        return conference && participantCount > 1;
    },
    /* listener */ (enableAudio, store) => _maybeEnableAudio(enableAudio, store)
);

/**
 * Notifies this feature that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @private
 * @returns {void}
 */
function _appWillMount(store) {
    const subscriptions = [
        AudioModeEmitter.addListener(AudioMode.DEVICE_CHANGE_EVENT, _onDevicesUpdate, store)
    ];

    store.dispatch({
        type: _SET_AUDIOMODE_SUBSCRIPTIONS,
        subscriptions
    });
}

/**
 * Applies only to iOS. Enables / disables the Audio Unit. When the audio unit is
 * enabled audio will flow on both directions.
 *
 * @param {boolean} enabled - Whether audio should be enabled or not.
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _maybeEnableAudio(enabled, { getState }) {
    // XXX: Ideally we'd want to call AudioMode.setAudioEnabled here, but that too won't work
    // without telling CallKit to hold the call. Yeah, I know we don't support it, but hey
    // thiss was the only workaround that ddid the job.
    if (RNCallKit) {
        const conference = getCurrentConference(getState);

        if (conference && conference.callUUID) {
            RNCallKit.setCallOnHold(conference.callUUID, !enabled);
        }
    }
}

/**
 * Handles audio device changes. The list will be stored on the redux store.
 *
 * @param {Object} devices - The current list of devices.
 * @private
 * @returns {void}
 */
function _onDevicesUpdate(devices) {
    const { dispatch } = this; // eslint-disable-line no-invalid-this

    dispatch({
        type: _SET_AUDIOMODE_DEVICES,
        devices
    });
}

/**
 * Notifies this feature that the action
 * {@link _SET_AUDIOMODE_SUBSCRIPTIONS} is being dispatched within
 * a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @private
 * @returns {void}
 */
function _setSubscriptions({ getState }) {
    const { subscriptions } = getState()['features/mobile/audio-mode'];

    if (subscriptions) {
        for (const subscription of subscriptions) {
            subscription.remove();
        }
    }
}

/**
 * Updates the audio mode based on the current (redux) state.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} in the specified {@code store}.
 * @param {Action} action - The redux action which is
 * being dispatched in the specified {@code store}.
 * @private
 * @returns {*} The value returned by {@code next(action)}.
 */
function _updateAudioMode({ getState }, next, action) {
    const result = next(action);
    const state = getState();
    const conference = getCurrentConference(state);
    const { enabled: audioOnly } = state['features/base/audio-only'];
    let mode;

    if (conference) {
        mode = audioOnly ? AudioMode.AUDIO_CALL : AudioMode.VIDEO_CALL;
    } else {
        mode = AudioMode.DEFAULT;
    }

    AudioMode.setMode(mode).catch(err => logger.error(`Failed to set audio mode ${String(mode)}: ${err}`));

    return result;
}
