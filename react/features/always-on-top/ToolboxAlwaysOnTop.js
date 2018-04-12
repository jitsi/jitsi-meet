// @flow

import React, { Component } from 'react';

// FIXME: AlwaysOnTop imports the button directly in order to avoid bringing in
// other components that use lib-jitsi-meet, which always on top does not
// import.
import ToolbarButton from '../toolbox/components/ToolbarButton';

const { api } = window.alwaysOnTop;

/**
 * The type of the React {@code Component} props of {@link ToolboxAlwaysOnTop}.
 */
type Props = {

    /**
     * Whether or not microphone access is available.
     */
    audioAvailable: boolean,

    /**
     * Whether or not the user is currently audio muted.
     */
    audioMuted: boolean,

    /**
     * Additional CSS class names to add to the root of the toolbar.
     */
    className: string,

    /**
     * Callback invoked when no longer moused over the toolbar.
     */
    onMouseOut: Function,

    /**
     * Callback invoked when the mouse has moved over the toolbar.
     */
     onMouseOver: Function,

    /**
     * Whether or not camera access is available.
     */
    videoAvailable: boolean,

    /**
     * Whether or not the user is currently video muted.
     */
    videoMuted: boolean
};

/**
 * Represents the toolbar in the Always On Top window.
 *
 * @extends Component
 */
export default class ToolboxAlwaysOnTop extends Component<Props> {
    /**
     * Initializes a new {@code ToolboxAlwaysOnTop} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onToolbarHangup = this._onToolbarHangup.bind(this);
        this._onToolbarToggleAudio = this._onToolbarToggleAudio.bind(this);
        this._onToolbarToggleVideo = this._onToolbarToggleVideo.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            audioAvailable,
            audioMuted,
            className = '',
            onMouseOut,
            onMouseOver,
            videoAvailable,
            videoMuted
        } = this.props;

        const videoMuteIcon = `${videoMuted || !videoAvailable
            ? 'icon-camera-disabled toggled' : 'icon-camera'} ${
            videoAvailable ? '' : 'disabled'}`;
        const audioMuteIcon = `${audioMuted || !audioAvailable
            ? 'icon-mic-disabled toggled' : 'icon-microphone'} ${
            audioAvailable ? '' : 'disabled'}`;

        return (
            <div
                className = { `always-on-top-toolbox ${className}` }
                onMouseOut = { onMouseOut }
                onMouseOver = { onMouseOver }>
                <ToolbarButton
                    accessibilityLabel = 'Video mute'
                    iconName = { videoMuteIcon }
                    onClick = { this._onToolbarToggleVideo } />
                <ToolbarButton
                    accessibilityLabel = 'Hangup'
                    iconName = 'icon-hangup'
                    onClick = { this._onToolbarHangup } />
                <ToolbarButton
                    accessibilityLabel = 'Audio mute'
                    iconName = { audioMuteIcon }
                    onClick = { this._onToolbarToggleAudio } />
            </div>
        );
    }

    _onToolbarHangup: () => void;

    /**
     * Ends the conference call and closes the always on top window.
     *
     * @private
     * @returns {void}
     */
    _onToolbarHangup() {
        api.executeCommand('hangup');
        window.close();
    }

    _onToolbarToggleAudio: () => void;

    /**
     * Toggles audio mute if audio is avaiable.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleAudio() {
        if (this.props.audioAvailable) {
            api.executeCommand('toggleAudio');
        }
    }

    _onToolbarToggleVideo: () => void;

    /**
     * Toggles video mute if video is avaiable.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleVideo() {
        if (this.props.videoAvailable) {
            api.executeCommand('toggleVideo');
        }
    }
}
