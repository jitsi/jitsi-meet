// @flow

import { Platform } from 'react-native';
import * as watch from 'react-native-watch-connectivity';

import { appNavigate } from '../../app/actions';
import { APP_WILL_MOUNT } from '../../base/app';
import { CONFERENCE_JOINED } from '../../base/conference';
import { getCurrentConferenceUrl } from '../../base/connection';
import { setAudioMuted } from '../../base/media';
import {
    MiddlewareRegistry,
    StateListenerRegistry,
    toState
} from '../../base/redux';

import { setConferenceTimestamp, setSessionId, setWatchReachable } from './actions';
import { CMD_HANG_UP, CMD_JOIN_CONFERENCE, CMD_SET_MUTED, MAX_RECENT_URLS } from './constants';
import logger from './logger';

const watchOSEnabled = Platform.OS === 'ios';

// Handles the recent URLs state sent to the watch
watchOSEnabled && StateListenerRegistry.register(
    /* selector */ state => state['features/recent-list'],
    /* listener */ (recentListState, { getState }) => {
        _updateApplicationContext(getState);
    });

// Handles the mic muted state sent to the watch
watchOSEnabled && StateListenerRegistry.register(
    /* selector */ state => _isAudioMuted(state),
    /* listener */ (isAudioMuted, { getState }) => {
        _updateApplicationContext(getState);
    });

// Handles the conference URL state sent to the watch
watchOSEnabled && StateListenerRegistry.register(
    /* selector */ state => getCurrentConferenceUrl(state),
    /* listener */ (currentUrl, { dispatch, getState }) => {
        dispatch(setSessionId());
        _updateApplicationContext(getState);
    });

/**
 * Middleware that captures conference actions.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
watchOSEnabled && MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        _appWillMount(store);
        break;
    case CONFERENCE_JOINED:
        store.dispatch(setConferenceTimestamp(new Date().getTime()));
        _updateApplicationContext(store.getState());
        break;
    }

    return next(action);
});

/**
 * Registers listeners to the react-native-watch-connectivity lib.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _appWillMount({ dispatch, getState }) {
    watch.subscribeToWatchReachability((error, reachable) => {
        dispatch(setWatchReachable(reachable));
        _updateApplicationContext(getState);
    });

    watch.subscribeToMessages((error, message) => {
        if (error) {
            logger.error('watch.subscribeToMessages error:', error);

            return;
        }

        const {
            command,
            sessionID
        } = message;
        const currentSessionID = _getSessionId(getState());

        if (!sessionID || sessionID !== currentSessionID) {
            logger.warn(
                `Ignoring outdated watch command: ${message.command}`
                    + ` sessionID: ${sessionID} current session ID: ${currentSessionID}`);

            return;
        }

        switch (command) {
        case CMD_HANG_UP:
            if (typeof getCurrentConferenceUrl(getState()) !== 'undefined') {
                dispatch(appNavigate(undefined));
            }
            break;
        case CMD_JOIN_CONFERENCE: {
            const newConferenceURL = message.data;
            const oldConferenceURL = getCurrentConferenceUrl(getState());

            if (oldConferenceURL !== newConferenceURL) {
                dispatch(appNavigate(newConferenceURL));
            }
            break;
        }
        case CMD_SET_MUTED:
            dispatch(
                setAudioMuted(
                    message.muted === 'true',
                    /* ensureTrack */ true));
            break;
        }
    });
}

/**
 * Gets the current Apple Watch session's ID. A new session is started whenever the conference URL has changed. It is
 * used to filter out outdated commands which may arrive very later if the Apple Watch loses the connectivity.
 *
 * @param {Object|Function} stateful - Either the whole Redux state object or the Redux store's {@code getState} method.
 * @returns {number}
 * @private
 */
function _getSessionId(stateful) {
    const state = toState(stateful);

    return state['features/mobile/watchos'].sessionID;
}

/**
 * Gets the list of recent URLs to be passed over to the Watch app.
 *
 * @param {Object|Function} stateful - Either the whole Redux state object or the Redux store's {@code getState} method.
 * @returns {Array<Object>}
 * @private
 */
function _getRecentUrls(stateful) {
    const state = toState(stateful);
    const recentURLs = state['features/recent-list'];

    // Trim to MAX_RECENT_URLS and reverse the list
    const reversedList = recentURLs.slice(-MAX_RECENT_URLS);

    reversedList.reverse();

    return reversedList;
}

/**
 * Determines the audio muted state to be sent to the apple watch.
 *
 * @param {Object|Function} stateful - Either the whole Redux state object or the Redux store's {@code getState} method.
 * @returns {boolean}
 * @private
 */
function _isAudioMuted(stateful) {
    const state = toState(stateful);
    const { audio } = state['features/base/media'];

    return audio.muted;
}

/**
 * Sends the context to the watch os app. At the time of this writing it's the entire state of
 * the 'features/mobile/watchos' reducer.
 *
 * @param {Object|Function} stateful - Either the whole Redux state object or the Redux store's {@code getState} method.
 * @private
 * @returns {void}
 */
function _updateApplicationContext(stateful) {
    const state = toState(stateful);
    const { conferenceTimestamp, sessionID, watchReachable } = state['features/mobile/watchos'];

    if (!watchReachable) {
        return;
    }

    try {
        watch.updateApplicationContext({
            conferenceTimestamp,
            conferenceURL: getCurrentConferenceUrl(state),
            micMuted: _isAudioMuted(state),
            recentURLs: _getRecentUrls(state),
            sessionID
        });
    } catch (error) {
        logger.error('Failed to stringify or send the context', error);
    }
}
