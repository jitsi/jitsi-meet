/* @flow */

import React, { Component } from 'react';

import {
    createRemoteVideoMenuButtonEvent,
    sendAnalytics
} from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconRemoteControlStart, IconRemoteControlStop } from '../../../base/icons';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

// TODO: Move these enums into the store after further reactification of the
// non-react RemoteVideo component.
export const REMOTE_CONTROL_MENU_STATES = {
    NOT_SUPPORTED: 0,
    NOT_STARTED: 1,
    REQUESTING: 2,
    STARTED: 3
};

/**
 * The type of the React {@code Component} props of {@link RemoteControlButton}.
 */
type Props = {

    /**
     * The callback to invoke when the component is clicked.
     */
    onClick: Function,

    /**
     * The ID of the participant linked to the onClick callback.
     */
    participantID: string,

    /**
     * The current status of remote control. Should be a number listed in the
     * enum REMOTE_CONTROL_MENU_STATES.
     */
    remoteControlState: number,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which displays a button showing the
 * current state of remote control for a participant and can start or stop a
 * remote control session.
 *
 * @extends Component
 */
class RemoteControlButton extends Component<Props> {
    /**
     * Initializes a new {@code RemoteControlButton} instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null|ReactElement}
     */
    render() {
        const {
            participantID,
            remoteControlState,
            t
        } = this.props;

        let className, icon;

        switch (remoteControlState) {
        case REMOTE_CONTROL_MENU_STATES.NOT_STARTED:
            icon = IconRemoteControlStart;
            break;
        case REMOTE_CONTROL_MENU_STATES.REQUESTING:
            className = ' disabled';
            icon = IconRemoteControlStart;
            break;
        case REMOTE_CONTROL_MENU_STATES.STARTED:
            icon = IconRemoteControlStop;
            break;
        case REMOTE_CONTROL_MENU_STATES.NOT_SUPPORTED:

            // Intentionally fall through.
        default:
            return null;
        }

        return (
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.remoteControl') }
                displayClass = { className }
                icon = { icon }
                id = { `remoteControl_${participantID}` }
                onClick = { this._onClick } />
        );
    }

    _onClick: () => void;

    /**
     * Sends analytics event for pressing the button and executes the passed
     * onClick handler.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        const { onClick, participantID, remoteControlState } = this.props;

        // TODO: What do we do in case the state is e.g. "requesting"?
        if (remoteControlState === REMOTE_CONTROL_MENU_STATES.STARTED
            || remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED) {

            const enable
                = remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED;

            sendAnalytics(createRemoteVideoMenuButtonEvent(
                'remote.control.button',
                {
                    enable,
                    'participant_id': participantID
                }));
        }

        if (onClick) {
            onClick();
        }
    }
}

export default translate(RemoteControlButton);
