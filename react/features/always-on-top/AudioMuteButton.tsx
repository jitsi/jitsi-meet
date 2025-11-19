import React, { Component } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)

import { DEFAULT_ICON } from '../base/icons/svg/constants';
import { IProps } from '../base/toolbox/components/AbstractButton';

import ToolbarButton from './ToolbarButton';

const { api } = window.alwaysOnTop;

/**
 * The type of the React {@code Component} state of {@link AudioMuteButton}.
 */
interface IState {

    /**
     * Whether audio is available is not.
     */
    audioAvailable: boolean;

    /**
     * Whether audio is muted or not.
     */
    audioMuted: boolean;
}

type Props = Partial<IProps>;

/**
 * Stateless "mute/unmute audio" button for the Always-on-Top windows.
 */
export default class AudioMuteButton extends Component<Props, IState> {
    icon = DEFAULT_ICON.IconMic;
    toggledIcon = DEFAULT_ICON.IconMicSlash;
    accessibilityLabel = 'Audio mute';

    /**
     * Initializes a new {@code AudioMuteButton} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code AudioMuteButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            audioAvailable: false,
            audioMuted: true
        };

        // Bind event handlers so they are only bound once per instance.
        this._audioAvailabilityListener
            = this._audioAvailabilityListener.bind(this);
        this._audioMutedListener = this._audioMutedListener.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        api.on('audioAvailabilityChanged', this._audioAvailabilityListener);
        api.on('audioMuteStatusChanged', this._audioMutedListener);

        Promise.all([
            api.isAudioAvailable(),
            api.isAudioMuted(),
            api.isAudioDisabled?.() || Promise.resolve(false)
        ])
            .then(([ audioAvailable, audioMuted, audioDisabled ]) =>
                this.setState({
                    audioAvailable: audioAvailable && !audioDisabled,
                    audioMuted
                }))
            .catch(console.error);
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        api.removeListener(
            'audioAvailabilityChanged',
            this._audioAvailabilityListener);
        api.removeListener(
            'audioMuteStatusChanged',
            this._audioMutedListener);
    }

    /**
     * Handles audio available api events.
     *
     * @param {{ available: boolean }} status - The new available status.
     * @returns {void}
     */
    _audioAvailabilityListener({ available }: { available: boolean; }) {
        this.setState({ audioAvailable: available });
    }

    /**
     * Handles audio muted api events.
     *
     * @param {{ muted: boolean }} status - The new muted status.
     * @returns {void}
     */
    _audioMutedListener({ muted }: { muted: boolean; }) {
        this.setState({ audioMuted: muted });
    }

    /**
     * Indicates if audio is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        return this.state.audioMuted;
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.state.audioAvailable;
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} _audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(_audioMuted: boolean) {
        this.state.audioAvailable && api.executeCommand('toggleAudio');
    }

    /**
     * Handles clicking / pressing the button, and toggles the audio mute state
     * accordingly.
     *
     * @returns {void}
     */
    _onClick() {
        this._setAudioMuted(!this._isAudioMuted());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const toggled = this._isAudioMuted();

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
