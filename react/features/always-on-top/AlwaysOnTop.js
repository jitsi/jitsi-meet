// @flow

import React, { Component } from 'react';

import ToolboxAlwaysOnTop from './ToolboxAlwaysOnTop';

const { api } = window.alwaysOnTop;

/**
 * The timeout in ms for hidding the toolbar.
 */
const TOOLBAR_TIMEOUT = 4000;

/**
 * The type of the React {@code Component} state of {@link FeedbackButton}.
 */
type State = {
    audioAvailable: boolean,
    audioMuted: boolean,
    avatarURL: string,
    displayName: string,
    isVideoDisplayed: boolean,
    videoAvailable: boolean,
    videoMuted: boolean,
    visible: boolean
};

/**
 * Represents the always on top page.
 *
 * @class AlwaysOnTop
 * @extends Component
 */
export default class AlwaysOnTop extends Component<*, State> {
    _hovered: boolean;

    /**
     * Initializes new AlwaysOnTop instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: *) {
        super(props);

        this.state = {
            visible: true,
            audioMuted: false,
            videoMuted: false,
            audioAvailable: false,
            videoAvailable: false,
            displayName: '',
            isVideoDisplayed: true,
            avatarURL: ''
        };

        // Bind event handlers so they are only bound once per instance.
        this._audioAvailabilityListener
            = this._audioAvailabilityListener.bind(this);
        this._audioMutedListener = this._audioMutedListener.bind(this);
        this._avatarChangedListener = this._avatarChangedListener.bind(this);
        this._largeVideoChangedListener
            = this._largeVideoChangedListener.bind(this);
        this._displayNameChangedListener
            = this._displayNameChangedListener.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
        this._videoAvailabilityListener
            = this._videoAvailabilityListener.bind(this);
        this._videoMutedListener = this._videoMutedListener.bind(this);
    }

    _audioAvailabilityListener: ({ available: boolean }) => void;

    /**
     * Handles audio available api events.
     *
     * @param {{ available: boolean }} status - The new available status.
     * @returns {void}
     */
    _audioAvailabilityListener({ available }) {
        this.setState({ audioAvailable: available });
    }

    _audioMutedListener: ({ muted: boolean }) => void;

    /**
     * Handles audio muted api events.
     *
     * @param {{ muted: boolean }} status - The new muted status.
     * @returns {void}
     */
    _audioMutedListener({ muted }) {
        this.setState({ audioMuted: muted });
    }

    _avatarChangedListener: () => void;

    /**
     * Handles avatar changed api events.
     *
     * @returns {void}
     */
    _avatarChangedListener({ avatarURL, id }) {
        if (api._getOnStageParticipant() !== id) {
            return;
        }

        if (avatarURL !== this.state.avatarURL) {
            this.setState({ avatarURL });
        }
    }

    _displayNameChangedListener: () => void;

    /**
     * Handles display name changed api events.
     *
     * @returns {void}
     */
    _displayNameChangedListener({ formattedDisplayName, id }) {
        if (api._getOnStageParticipant() !== id) {
            return;
        }

        if (formattedDisplayName !== this.state.displayName) {
            this.setState({ displayName: formattedDisplayName });
        }
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

    _largeVideoChangedListener: () => void;

    /**
     * Handles large video changed api events.
     *
     * @returns {void}
     */
    _largeVideoChangedListener() {
        const userID = api._getOnStageParticipant();
        const displayName = api._getFormattedDisplayName(userID);
        const avatarURL = api.getAvatarURL(userID);
        const isVideoDisplayed = Boolean(api._getLargeVideo());

        this.setState({
            avatarURL,
            displayName,
            isVideoDisplayed
        });
    }

    _mouseMove: () => void;

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

    _onMouseOut: () => void;

    /**
     * Toolbar mouse out handler.
     *
     * @returns {void}
     */
    _onMouseOut() {
        this._hovered = false;
    }

    _onMouseOver: () => void;

    /**
     * Toolbar mouse over handler.
     *
     * @returns {void}
     */
    _onMouseOver() {
        this._hovered = true;
    }

    _videoAvailabilityListener: ({ available: boolean }) => void;

    /**
     * Renders display name and avatar for the on stage participant.
     *
     * @returns {ReactElement}
     */
    _renderVideoNotAvailableScreen() {
        const { avatarURL, displayName, isVideoDisplayed } = this.state;

        if (isVideoDisplayed) {
            return null;
        }

        return (
            <div id = 'videoNotAvailableScreen'>
                {
                    avatarURL
                        ? <div id = 'avatarContainer'>
                            <img
                                id = 'avatar'
                                src = { avatarURL } />
                        </div>
                        : null
                }
                <div
                    className = 'displayname'
                    id = 'displayname'>
                    { displayName }
                </div>
            </div>
        );
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

    _videoMutedListener: ({ muted: boolean }) => void;

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
        api.on('largeVideoChanged', this._largeVideoChangedListener);
        api.on('displayNameChange', this._displayNameChangedListener);
        api.on('avatarChanged', this._avatarChangedListener);

        this._largeVideoChangedListener();

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
        api.removeListener('largeVideoChanged',
            this._largeVideoChangedListener);
        api.removeListener('displayNameChange',
            this._displayNameChangedListener);
        api.removeListener('avatarChanged', this._avatarChangedListener);
        window.removeEventListener('mousemove', this._mouseMove);
    }

    /**
     * Sets a timeout to hide the toolbar when the toolbar is shown.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUpdate(nextProps: *, nextState: State) {
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
        return (
            <div id = 'alwaysOnTop'>
                <ToolboxAlwaysOnTop
                    audioAvailable = { this.state.audioAvailable }
                    audioMuted = { this.state.audioMuted }
                    className = { this.state.visible ? 'fadeIn' : 'fadeOut' }
                    onMouseOut = { this._onMouseOut }
                    onMouseOver = { this._onMouseOver }
                    videoAvailable = { this.state.videoAvailable }
                    videoMuted = { this.state.videoMuted } />
                {
                    this._renderVideoNotAvailableScreen()
                }
            </div>
        );
    }
}
