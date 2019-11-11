// @flow

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import AbstractPresenterMuteButton from '../base/toolbox/components/AbstractPresenterMuteButton';
import type { Props } from '../base/toolbox/components/AbstractButton';

const { api } = window.alwaysOnTop;

/**
 * The type of the React {@code Component} state of {@link PresenterMuteButton}.
 */
type State = {

    /**
     * Whether video is available is not.
     */
    videoAvailable: boolean,

    /**
     * Whether presenter video is muted or not.
     */
    presenterMuted: boolean
};

/**
 * Stateless "mute/unmute presenter" button for the Always-on-Top windows.
 */
export default class PresenterMuteButton
    extends AbstractPresenterMuteButton<Props, State> {

    accessibilityLabel = 'Presenter mute';

    /**
     * Initializes a new {@code PresenterMuteButton} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code PresenterMuteButton} instance with.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            videoAvailable: false,
            presenterMuted: true
        };

        // Bind event handlers so they are only bound once per instance.
        this._videoAvailabilityListener
            = this._videoAvailabilityListener.bind(this);
        this._presenterMutedListener = this._presenterMutedListener.bind(this);
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('videoAvailabilityChanged', this._videoAvailabilityListener);
        api.on('presenterMuteStatusChanged', this._presenterMutedListener);
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
            'presenterMuteStatusChanged',
            this._presenterMutedListener);
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
     * Indicates if video is currently muted ot nor.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isPresenterMuted() {
        return this.state.presenterMuted;
    }

    /**
     * Changes the muted state.
     *
     * @override
     * @param {boolean} presenterMuted - Whether video should be muted or not.
     * @protected
     * @returns {void}
     */
    _setPresenterMuted(presenterMuted: boolean) { // eslint-disable-line no-unused-vars
        this.state.videoAvailable && api.executeCommand('togglePresenter');
    }

    _videoAvailabilityListener: ({ available: boolean }) => void;

    /**
     * Handles video available api events.
     *
     * @param {{ available: boolean }} status - The new available status.
     * @returns {void}
     */
    _videoAvailabilityListener({ available }) {
        this.setState({ videoAvailable: available });
    }

    _presenterMutedListener: ({ muted: boolean }) => void;

    /**
     * Handles video muted api events.
     *
     * @param {{ muted: boolean }} status - The new muted status.
     * @returns {void}
     */
    _presenterMutedListener({ muted }) {
        this.setState({ presenterMuted: muted });
    }
}
