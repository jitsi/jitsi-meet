import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Popover } from '../../base/popover';

import {
    MuteButton,
    KickButton,
    RemoteControlButton,
    RemoteVideoMenu,
    VolumeSlider
} from './';

declare var $: Object;
declare var interfaceConfig: Object;

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the {@code RemoteVideoMenu}.
 *
 * @extends {Component}
 */
class RemoteVideoMenuTriggerButton extends Component {
    static propTypes = {
        /**
         * A value between 0 and 1 indicating the volume of the participant's
         * audio element.
         */
        initialVolumeValue: PropTypes.number,

        /**
         * Whether or not the participant is currently muted.
         */
        isAudioMuted: PropTypes.bool,

        /**
         * Whether or not the participant is a conference moderator.
         */
        isModerator: PropTypes.bool,

        /**
         * Callback to invoke when the popover has been displayed.
         */
        onMenuDisplay: PropTypes.func,

        /**
         * Callback to invoke choosing to start a remote control session with
         * the participant.
         */
        onRemoteControlToggle: PropTypes.func,

        /**
         * Callback to invoke when changing the level of the participant's
         * audio element.
         */
        onVolumeChange: PropTypes.func,

        /**
         * The ID for the participant on which the remote video menu will act.
         */
        participantID: PropTypes.string,

        /**
         * The current state of the participant's remote control session.
         */
        remoteControlState: PropTypes.number
    };

    /**
     * Initializes a new {#@code RemoteVideoMenuTriggerButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to topmost DOM/HTML element backing the React
         * {@code Component}. Accessed directly for associating an element as
         * the trigger for a popover.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._rootElement = null;

        // Bind event handler so it is only bound once for every instance.
        this._onShowRemoteMenu = this._onShowRemoteMenu.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const content = this._renderRemoteVideoMenu();

        if (!content) {
            return null;
        }

        return (
            <Popover
                content = { content }
                onPopoverOpen = { this._onShowRemoteMenu }
                position = { interfaceConfig.VERTICAL_FILMSTRIP
                    ? 'left middle' : 'top center' }>
                <span
                    className = 'popover-trigger remote-video-menu-trigger'>
                    <i
                        className = 'icon-thumb-menu'
                        title = 'Remote user controls' />
                </span>
            </Popover>
        );
    }

    /**
     * Opens the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onShowRemoteMenu() {
        this.props.onMenuDisplay();
    }

    /**
     * Creates a new {@code RemoteVideoMenu} with buttons for interacting with
     * the remote participant.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderRemoteVideoMenu() {
        const {
            initialVolumeValue,
            isAudioMuted,
            isModerator,
            onRemoteControlToggle,
            onVolumeChange,
            remoteControlState,
            participantID
        } = this.props;

        const buttons = [];

        if (isModerator) {
            buttons.push(
                <MuteButton
                    isAudioMuted = { isAudioMuted }
                    key = 'mute'
                    participantID = { participantID } />
            );
            buttons.push(
                <KickButton
                    key = 'kick'
                    participantID = { participantID } />
            );
        }

        if (remoteControlState) {
            buttons.push(
                <RemoteControlButton
                    key = 'remote-control'
                    onClick = { onRemoteControlToggle }
                    participantID = { participantID }
                    remoteControlState = { remoteControlState } />
            );
        }

        if (onVolumeChange && isModerator) {
            buttons.push(
                <VolumeSlider
                    initialValue = { initialVolumeValue }
                    key = 'volume-slider'
                    onChange = { onVolumeChange } />
            );
        }

        if (buttons.length > 0) {
            return (
                <RemoteVideoMenu id = { participantID }>
                    { buttons }
                </RemoteVideoMenu>
            );
        }

        return null;
    }
}

export default RemoteVideoMenuTriggerButton;
