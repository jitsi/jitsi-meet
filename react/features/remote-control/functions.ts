import React from 'react';

// @ts-expect-error
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { IReduxState, IStore } from '../app/types';
import { IJitsiConference } from '../base/conference/reducer';
import JitsiMeetJS from '../base/lib-jitsi-meet';

import { enableReceiver, stopReceiver } from './actions';
import { EVENTS, REMOTE_CONTROL_MESSAGE_NAME } from './constants';
import { keyboardEventToKey } from './keycodes';
import logger from './logger';

/**
 * Checks if the remote control is enabled.
 *
 * @param {*} state - The redux state.
 * @returns {boolean} - True if the remote control is enabled and false otherwise.
 */
export function isRemoteControlEnabled(state: IReduxState) {
    return !state['features/base/config'].disableRemoteControl && JitsiMeetJS.isDesktopSharingEnabled();
}

/**
 * Sends remote control message to other participant through data channel.
 *
 * @param {JitsiConference} conference - The JitsiConference object.
 * @param {string} to - The participant who will receive the event.
 * @param {RemoteControlEvent} event - The remote control event.
 * @returns {boolean} - True if the message was sent successfully and false otherwise.
 */
export function sendRemoteControlEndpointMessage(
        conference: IJitsiConference | undefined,
        to: string | undefined,
        event: Object) {
    if (!to) {
        logger.warn('Remote control: Skip sending remote control event. Params:', to);

        return false;
    }

    try {
        conference?.sendEndpointMessage(to, {
            name: REMOTE_CONTROL_MESSAGE_NAME,
            ...event
        });

        return true;
    } catch (error) {
        logger.error('Failed to send EndpointMessage via the datachannels', error);

        return false;
    }
}

/**
* Handles remote control events from the external app. Currently only
* events with type EVENTS.supported and EVENTS.stop are
* supported.
*
* @param {RemoteControlEvent} event - The remote control event.
* @param {Store} store - The redux store.
* @returns {void}
*/
export function onRemoteControlAPIEvent(event: { type: string; }, { getState, dispatch }: IStore) {
    switch (event.type) {
    case EVENTS.supported:
        logger.log('Remote Control supported.');
        if (isRemoteControlEnabled(getState())) {
            dispatch(enableReceiver());
        } else {
            logger.log('Remote Control disabled.');
        }
        break;
    case EVENTS.stop: {
        dispatch(stopReceiver());

        break;
    }
    }
}

/**
 * Returns the area used for capturing mouse and key events.
 *
 * @returns {JQuery} - A JQuery selector.
 */
export function getRemoteConrolEventCaptureArea() {
    return VideoLayout.getLargeVideoWrapper();
}


/**
 * Extract the keyboard key from the keyboard event.
 *
 * @param {KeyboardEvent} event - The event.
 * @returns {KEYS} The key that is pressed or undefined.
 */
export function getKey(event: React.KeyboardEvent) {
    return keyboardEventToKey(event);
}

/**
 * Extract the modifiers from the keyboard event.
 *
 * @param {KeyboardEvent} event - The event.
 * @returns {Array} With possible values: "shift", "control", "alt", "command".
 */
export function getModifiers(event: React.KeyboardEvent) {
    const modifiers = [];

    if (event.shiftKey) {
        modifiers.push('shift');
    }

    if (event.ctrlKey) {
        modifiers.push('control');
    }


    if (event.altKey) {
        modifiers.push('alt');
    }

    if (event.metaKey) {
        modifiers.push('command');
    }

    return modifiers;
}

