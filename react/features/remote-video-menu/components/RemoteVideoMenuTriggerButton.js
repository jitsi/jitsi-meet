import { default as Popover } from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

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
        initialVolumeValue: React.PropTypes.number,

        /**
         * Whether or not the participant is currently muted.
         */
        isAudioMuted: React.PropTypes.bool,

        /**
         * Whether or not the participant is a conference moderator.
         */
        isModerator: React.PropTypes.bool,

        /**
         * Callback to invoke when the popover has been displayed.
         */
        onMenuDisplay: React.PropTypes.func,

        /**
         * Callback to invoke choosing to start a remote control session with
         * the participant.
         */
        onRemoteControlToggle: React.PropTypes.func,

        /**
         * Callback to invoke when changing the level of the participant's
         * audio element.
         */
        onVolumeChange: React.PropTypes.func,

        /**
         * The ID for the participant on which the remote video menu will act.
         */
        participantID: React.PropTypes.string,

        /**
         * The current state of the participant's remote control session.
         */
        remoteControlState: React.PropTypes.number
    };

    /**
     * Initializes a new {#@code RemoteVideoMenuTriggerButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            showRemoteMenu: false
        };

        /**
         * The internal reference to topmost DOM/HTML element backing the React
         * {@code Component}. Accessed directly for associating an element as
         * the trigger for a popover.
         *
         * @private
         * @type {HTMLDivElement}
         */
        this._rootElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onHideRemoteMenu = this._onHideRemoteMenu.bind(this);
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
            <div
                onMouseEnter = { this._onShowRemoteMenu }
                onMouseLeave = { this._onHideRemoteMenu }>
                <Popover
                    content = { content }
                    isOpen = { this.state.showRemoteMenu }
                    position = { interfaceConfig.VERTICAL_FILMSTRIP
                        ? 'left middle' : 'top center' }>
                    <span
                        className = 'popover-trigger remote-video-menu-trigger'>
                        <i
                            className = 'icon-thumb-menu'
                            title = 'Remote user controls' />
                    </span>
                </Popover>
            </div>
        );
    }

    /**
     * Closes the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onHideRemoteMenu() {
        this.setState({ showRemoteMenu: false });
    }

    /**
     * Opens the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onShowRemoteMenu() {
        this.props.onMenuDisplay();

        this.setState({ showRemoteMenu: true });
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
                    onClick = { this._onHideRemoteMenu }
                    participantID = { participantID } />
            );
            buttons.push(
                <KickButton
                    key = 'kick'
                    onClick = { this._onHideRemoteMenu }
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
                <div>
                    <RemoteVideoMenu id = { participantID }>
                        { buttons }
                    </RemoteVideoMenu>
                    <div
                        className = { interfaceConfig.VERTICAL_FILMSTRIP
                            ? 'popover-mousemove-padding-right'
                            : 'popover-mousemove-padding-bottom' } />
                </div>
            );
        }

        return null;
    }
}

export default RemoteVideoMenuTriggerButton;
