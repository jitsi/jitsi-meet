import AKInlineDialog from '@atlaskit/inline-dialog';
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
        this._onRemoteMenuClose = this._onRemoteMenuClose.bind(this);
        this._onRemoteMenuToggle = this._onRemoteMenuToggle.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <AKInlineDialog
                content = { this._renderRemoteVideoMenu() }
                isOpen = { this.state.showRemoteMenu }
                onClose = { this._onRemoteMenuClose }
                position = { interfaceConfig.VERTICAL_FILMSTRIP
                    ? 'left middle' : 'top center' }
                shouldFlip = { true }>
                <span
                    className = 'popover-trigger remote-video-menu-trigger'
                    onClick = { this._onRemoteMenuToggle }>
                    <i
                        className = 'icon-thumb-menu'
                        title = 'Remote user controls' />
                </span>
            </AKInlineDialog>
        );
    }

    /**
     * Closes the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onRemoteMenuClose() {
        this.setState({ showRemoteMenu: false });
    }

    /**
     * Opens or closes the {@code RemoteVideoMenu}.
     *
     * @private
     * @returns {void}
     */
    _onRemoteMenuToggle() {
        const willShowRemoteMenu = !this.state.showRemoteMenu;

        if (willShowRemoteMenu) {
            this.props.onMenuDisplay();
        }

        this.setState({ showRemoteMenu: willShowRemoteMenu });
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

        return (
            <RemoteVideoMenu id = { participantID }>
                { isModerator
                    ? <MuteButton
                        isAudioMuted = { isAudioMuted }
                        onClick = { this._onRemoteMenuClose }
                        participantID = { participantID } />
                    : null }
                { isModerator
                    ? <KickButton
                        onClick = { this._onRemoteMenuClose }
                        participantID = { participantID } />
                    : null }
                { remoteControlState
                    ? <RemoteControlButton
                        onClick = { onRemoteControlToggle }
                        participantID = { participantID }
                        remoteControlState = { remoteControlState } />
                    : null }
                { onVolumeChange
                    ? <VolumeSlider
                        initialValue = { initialVolumeValue }
                        onChange = { onVolumeChange } />
                    : null }
            </RemoteVideoMenu>
        );
    }
}

export default RemoteVideoMenuTriggerButton;
