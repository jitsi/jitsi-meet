// @flow

// XXX: AlwaysOnTop imports the button directly in order to avoid bringing in
// other components that use lib-jitsi-meet, which always on top does not
// import.
import AbstractAudioMuteButton
    from '../toolbox/components/buttons/AbstractAudioMuteButton';
import type { Props } from '../toolbox/components/buttons/AbstractButton';

const { api } = window.alwaysOnTop;

type State = {

    /**
     * Whether audio is available is not.
     */
    audioAvailable: boolean,

    /**
     * Whether audio is muted or not.
     */
    audioMuted: boolean
};

/**
 * Stateless hangup button for the Always-on-Top windows.
 */
export default class AudioMuteButton
    extends AbstractAudioMuteButton<Props, State> {

    /**
     * Initializes a new {@code AudioMuteButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
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
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('audioAvailabilityChanged', this._audioAvailabilityListener);
        api.on('audioMuteStatusChanged', this._audioMutedListener);

        Promise.all([
            api.isAudioAvailable(),
            api.isAudioMuted()
        ])
            .then(values => {
                const [ audioAvailable, audioMuted ] = values;

                this.setState({
                    audioAvailable,
                    audioMuted
                });
            })
            .catch(console.error);
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        api.removeListener('audioAvailabilityChanged',
            this._audioAvailabilityListener);
        api.removeListener('audioMuteStatusChanged',
            this._audioMutedListener);
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return !this.state.audioAvailable;
    }

    /**
     * Indicates if audio is currently muted ot nor.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isAudioMuted() {
        return this.state.audioMuted;
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} audioMuted - Whether audio should be muted or not.
     * @private
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) { // eslint-disable-line no-unused-vars
        this.state.audioAvailable && api.executeCommand('toggleAudio');
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
}
