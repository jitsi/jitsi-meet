import React, { Component } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import { DEFAULT_ICON } from '../base/icons/svg/constants';
import { IProps } from '../base/toolbox/components/AbstractButton';

import ToolbarButton from './ToolbarButton';

const { api } = window.alwaysOnTop;

type Props = Partial<IProps>;

/**
 * The type of the React {@code Component} state of {@link VideoMuteButton}.
 */
type State = {

    /**
     * Whether video is available is not.
     */
    videoAvailable: boolean;

    /**
     * Whether video is muted or not.
     */
    videoMuted: boolean;
};

/**
 * Stateless "mute/unmute video" button for the Always-on-Top windows.
 */
export default class VideoMuteButton extends Component<Props, State> {

    icon = DEFAULT_ICON.IconVideo;
    toggledIcon = DEFAULT_ICON.IconVideoOff;
    accessibilityLabel = 'Video mute';

    /**
     * Initializes a new {@code VideoMuteButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code VideoMuteButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            videoAvailable: false,
            videoMuted: true
        };

        // Bind event handlers so they are only bound once per instance.
        this._videoAvailabilityListener
            = this._videoAvailabilityListener.bind(this);
        this._videoMutedListener = this._videoMutedListener.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('videoAvailabilityChanged', this._videoAvailabilityListener);
        api.on('videoMuteStatusChanged', this._videoMutedListener);

        Promise.all([
            api.isVideoAvailable(),
            api.isVideoMuted()
        ])
            .then(([ videoAvailable, videoMuted ]) =>
                this.setState({
                    videoAvailable,
                    videoMuted
                }))
            .catch(console.error);
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        api.removeListener(
            'videoAvailabilityChanged',
            this._videoAvailabilityListener);
        api.removeListener(
            'videoMuteStatusChanged',
            this._videoMutedListener);
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.state.videoAvailable;
    }

    /**
     * Indicates if video is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isVideoMuted() {
        return this.state.videoMuted;
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} _videoMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setVideoMuted(_videoMuted: boolean) {
        this.state.videoAvailable && api.executeCommand('toggleVideo', false, true);
    }

    /**
     * Handles video available api events.
     *
     * @param {{ available: boolean }} status - The new available status.
     * @returns {void}
     */
    _videoAvailabilityListener({ available }: { available: boolean; }) {
        this.setState({ videoAvailable: available });
    }

    /**
     * Handles video muted api events.
     *
     * @param {{ muted: boolean }} status - The new muted status.
     * @returns {void}
     */
    _videoMutedListener({ muted }: { muted: boolean; }) {
        this.setState({ videoMuted: muted });
    }

    /**
     * Handles clicking / pressing the button, and toggles the video mute state
     * accordingly.
     *
     * @protected
     * @returns {void}
     */
    _onClick() {
        this._setVideoMuted(!this._isVideoMuted());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const toggled = this._isVideoMuted();

        return (
            <ToolbarButton
                accessibilityLabel = { this.accessibilityLabel }
                disabled = { this._isDisabled() }
                icon = { toggled ? this.toggledIcon : this.icon }
                onClick = { this._onClick }
                toggled = { toggled } />
        );
    }
}
