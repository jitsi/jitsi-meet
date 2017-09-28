/* @flow */

import { Platform } from 'react-native';
import * as watch from 'react-native-watch-connectivity';

import { setConferenceURL } from './actions';
import {
    SET_CONFERENCE_URL,
    SET_MIC_MUTED,
    SET_RECENT_URLS
} from './actionTypes';
import { ADD_RECENT_URL, LOADED_RECENT_URLS } from '../../recent';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT, appNavigate } from '../../app';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_WILL_JOIN,
    CONFERENCE_WILL_LEAVE,
    JITSI_CONFERENCE_URL_KEY
} from '../../base/conference';
import { SET_AUDIO_MUTED, toggleAudioMuted } from '../../base/media';
import { MiddlewareRegistry } from '../../base/redux';
import { getInviteURL } from '../../base/connection';


/**
 * Middleware that captures conference actions and sets the correct audio mode
 * based on the type of conference. Audio-only conferences don't use the speaker
 * by default, and video conferences do.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    if (Platform.OS !== 'ios') {
        return result;
    }

    switch (action.type) {
    case APP_WILL_MOUNT: {
        watch.subscribeToWatchState((err, watchState) => {
            if (!err) {
                console.log('watchState', watchState);

                // FIXME that does not seem to help with the initial sync up
                // if (watchState === 'Activated') {
                //    _updateApplicationContext(getState);
                // }
            } else {
                console.log('ERROR getting watchState');
            }
        });

        watch.subscribeToMessages((err, message) => {
            if (err) {
                console.log('ERROR getting watch message');
            } else {
                switch (message.command) {
                case 'joinConference': {
                    const newConferenceURL = message.data;
                    const oldConferenceURL
                        = _getConferenceUrlFromBaseConf(getState);

                    console.info(`WATCH - JOIN URL: ${newConferenceURL}`);
                    if (oldConferenceURL === newConferenceURL) {
                        console.info('No need to navigate');
                    } else {
                        // Set conference URL early to avoid NULL being sent as
                        // part of other updates.
                        // FIXME check if we'd go back to NULL on join failure.
                        dispatch(setConferenceURL(newConferenceURL));
                        dispatch(appNavigate(newConferenceURL));
                    }
                    break;
                }
                case 'toggleMute':
                    console.info('WATCH - TOGGLE MUTED');
                    dispatch(toggleAudioMuted());
                    break;
                case 'hangup':
                    console.info('WATCH - HANG UP');
                    dispatch(appNavigate(undefined));
                    break;
                }
            }
        });

        break;
    }
    case ADD_RECENT_URL:
    case LOADED_RECENT_URLS: {
        dispatch({
            type: SET_RECENT_URLS,
            recentURLs: getState()['features/recent'].entries
        });
        break;
    }
    case SET_AUDIO_MUTED: {
        const { audio } = getState()['features/base/media'];

        dispatch({
            type: SET_MIC_MUTED,
            micMuted: Boolean(audio.muted)
        });
        break;
    }
    case CONFERENCE_FAILED:
    case CONFERENCE_WILL_LEAVE: {
        const conferenceURL = _getConferenceUrlFromBaseConf(getState);
        const watchConferenceURL = _getWatchConferenceURL(getState);

        // This may not be a real failure
        if (action.type === CONFERENCE_FAILED) {
            const conference = getState()['features/base/conference'];

            if (conference.authRequired || conference.passwordRequired) {

                break;
            }
        }

        // FIXME I have bad feelings about this logic, but it aims to fix
        // problem with setting NULL temporarily when selecting new conference
        // on the watch while still in the previous room. It will first emit
        // CONFERENCE_WILL_LEVE, before joining the new room and we don't want
        // to send NULL.
        if (watchConferenceURL !== 'NULL'
                && watchConferenceURL !== conferenceURL) {
            console.info(
                'Ignored action',
                action.type,
                `possibly for the previous conference ?: ${conferenceURL}`);
        } else if (action.type === CONFERENCE_WILL_LEAVE
                && conferenceURL === watchConferenceURL) {
            dispatch(setConferenceURL('NULL'));
        } else if (conferenceURL !== watchConferenceURL) {
            dispatch(setConferenceURL(conferenceURL));
        } else {
            console.info(
                'Did nothing on',
                action.type,
                conferenceURL,
                watchConferenceURL);
        }
        break;
    }
    case CONFERENCE_WILL_JOIN:
    case CONFERENCE_JOINED: {
        // NOTE for some reason 'null' does not update context - must be string
        const conferenceURL = _getConferenceUrlFromBaseConf(getState);
        const oldConferenceURL = _getWatchConferenceURL(getState);

        // NOTE Those updates are expensive!
        if (conferenceURL !== oldConferenceURL) {
            dispatch(setConferenceURL(conferenceURL));
        }
        break;
    }

    // Here list all actions that affect the watch OS application context.
    // The reducer should form all those actions into our context structure.
    case SET_CONFERENCE_URL:
    case SET_MIC_MUTED:
    case SET_RECENT_URLS: {
        _updateApplicationContext(getState, action);
        break;
    }
    case APP_WILL_UNMOUNT:
        break;
    }

    return result;
});

function _getWatchConferenceURL(getState) {
    const { conferenceURL } = getState()['features/mobile/watchos'];

    return conferenceURL;
}

function _getConferenceUrlFromBaseConf(getState) {

    // FIXME probably authRequired and paswordRequired should be included
    // as well...
    const { conference, joining, leaving }
        = getState()['features/base/conference'];
    const theConference = conference || joining || leaving;
    const conferenceURLObj
        = theConference && theConference[JITSI_CONFERENCE_URL_KEY];

    // NOTE for some reason 'null' does not update context - must be string
    return conferenceURLObj ? getInviteURL(conferenceURLObj) : 'NULL';
}

function _updateApplicationContext(getState, action) {
    const context = getState()['features/mobile/watchos'];

    console.info('UPDATING WATCH CONTEXT', context, action.type);
    watch.updateApplicationContext(context);
}
