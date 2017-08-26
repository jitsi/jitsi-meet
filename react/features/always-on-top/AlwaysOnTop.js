import React, { Component } from 'react';

import StatelessToolbar from '../toolbox/components/StatelessToolbar';
import StatelessToolbarButton
    from '../toolbox/components/StatelessToolbarButton';

const { api } = window.alwaysOnTop;

/**
 * The timeout in ms for hidding the toolbar.
 */
const TOOLBAR_TIMEOUT = 4000;

/**
 * Map with toolbar button descriptors.
 */
const toolbarButtons = {
    /**
     * The descriptor of the camera toolbar button.
     */
    camera: {
        classNames: [ 'button', 'icon-camera' ],
        enabled: true,
        id: 'toolbar_button_camera',
        onClick() {
            api.executeCommand('toggleVideo');
        }
    },

    /**
     * The descriptor of the toolbar button which hangs up the call/conference.
     */
    hangup: {
        classNames: [ 'button', 'icon-hangup', 'button_hangup' ],
        enabled: true,
        id: 'toolbar_button_hangup',
        onClick() {
            api.executeCommand('hangup');
            window.close();
        }
    },

    /**
     * The descriptor of the microphone toolbar button.
     */
    microphone: {
        classNames: [ 'button', 'icon-microphone' ],
        enabled: true,
        id: 'toolbar_button_mute',
        onClick() {
            api.executeCommand('toggleAudio');
        }
    }
};

/**
 * Represents the always on top page.
 *
 * @class AlwaysOnTop
 * @extends Component
 */
export default class AlwaysOnTop extends Component {
    /**
     * Initializes new AlwaysOnTop instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            visible: true,
            audioMuted: false,
            videoMuted: false,
            audioAvailable: false,
            videoAvailable: false
        };

        this._hovered = false;

        this._audioAvailabilityListener
            = this._audioAvailabilityListener.bind(this);
        this._audioMutedListener = this._audioMutedListener.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._videoAvailabilityListener
            = this._videoAvailabilityListener.bind(this);
        this._videoMutedListener = this._videoMutedListener.bind(this);
    }

    /**
     * Handles audio available api events.
     *
     * @param {{ available: boolean }} status - The new available status.
     * @returns {void}
     */
    _audioAvailabilityListener({ available }) {
        this.setState({ audioAvailable: available });
    }

    /**
     * Handles audio muted api events.
     *
     * @param {{ muted: boolean }} status - The new muted status.
     * @returns {void}
     */
    _audioMutedListener({ muted }) {
        this.setState({ audioMuted: muted });
    }

    /**
     * Hides the toolbar after a timeout.
     *
     * @returns {void}
     */
    _hideToolbarAfterTimeout() {
        setTimeout(() => {
            if (this._hovered) {
                this._hideToolbarAfterTimeout();

                return;
            }
            this.setState({ visible: false });
        }, TOOLBAR_TIMEOUT);
    }

    /**
     * Handles mouse move events.
     *
     * @returns {void}
     */
    _mouseMove() {
        if (!this.state.visible) {
            this.setState({ visible: true });
        }
    }

    /**
     * Toolbar mouse over handler.
     *
     * @returns {void}
     */
    _onMouseOver() {
        this._hovered = true;
    }

    /**
     * Toolbar mouse out handler.
     *
     * @returns {void}
     */
    _onMouseOut() {
        this._hovered = false;
    }

    /**
     * Handles audio available api events.
     *
     * @param {{ available: boolean }} status - The new available status.
     * @returns {void}
     */
    _videoAvailabilityListener({ available }) {
        this.setState({ videoAvailable: available });
    }

    /**
     * Handles video muted api events.
     *
     * @param {{ muted: boolean }} status - The new muted status.
     * @returns {void}
     */
    _videoMutedListener({ muted }) {
        this.setState({ videoMuted: muted });
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('audioMuteStatusChanged', this._audioMutedListener);
        api.on('videoMuteStatusChanged', this._videoMutedListener);
        api.on('audioAvailabilityChanged', this._audioAvailabilityListener);
        api.on('videoAvailabilityChanged', this._videoAvailabilityListener);

        Promise.all([
            api.isAudioMuted(),
            api.isVideoMuted(),
            api.isAudioAvailable(),
            api.isVideoAvailable()
        ])
        .then(([
            audioMuted = false,
            videoMuted = false,
            audioAvailable = false,
            videoAvailable = false
        ]) =>
            this.setState({
                audioMuted,
                videoMuted,
                audioAvailable,
                videoAvailable
            })
        )
        .catch(console.error);

        window.addEventListener('mousemove', this._mouseMove);

        this._hideToolbarAfterTimeout();
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        api.removeListener('audioMuteStatusChanged',
            this._audioMutedListener);
        api.removeListener('videoMuteStatusChanged',
            this._videoMutedListener);
        api.removeListener('audioAvailabilityChanged',
            this._audioAvailabilityListener);
        api.removeListener('videoAvailabilityChanged',
            this._videoAvailabilityListener);
        window.removeEventListener('mousemove', this._mouseMove);
    }

    /**
     * Sets a timeout to hide the toolbar when the toolbar is shown.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUpdate(nextProps, nextState) {
        if (!this.state.visible && nextState.visible) {
            this._hideToolbarAfterTimeout();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const className
            = `toolbar_primary always-on-top ${
                this.state.visible ? 'fadeIn' : 'fadeOut'}`;

        return (
            <StatelessToolbar
                className = { className }
                onMouseOut = { this._onMouseOut }
                onMouseOver = { this._onMouseOver }>
                {
                    Object.entries(toolbarButtons).map(([ key, button ]) => {
                        const { onClick } = button;
                        let enabled = false, toggled = false;

                        switch (key) {
                        case 'microphone':
                            enabled = this.state.audioAvailable;
                            toggled = enabled ? this.state.audioMuted : true;
                            break;
                        case 'camera':
                            enabled = this.state.videoAvailable;
                            toggled = enabled ? this.state.videoMuted : true;
                            break;
                        default: // hangup button
                            toggled = false;
                            enabled = true;
                        }

                        const updatedButton = {
                            ...button,
                            enabled,
                            toggled
                        };

                        return (
                            <StatelessToolbarButton
                                button = { updatedButton }
                                key = { key }
                                onClick = { onClick } />
                        );
                    })
                }
            </StatelessToolbar>
        );
    }
}
