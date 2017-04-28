import React, { Component } from 'react';

import { translate } from '../../base/i18n';

const TEST_SOUND_PATH = 'sounds/ring.wav';

/**
 * React {@code Component} for playing a test sound through a specified audio
 * device.
 *
 * @extends Component
 */
class AudioOutputPreview extends Component {
    /**
     * AudioOutputPreview component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The device id of the audio output device to use.
         */
        deviceId: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    }

    /**
     * Initializes a new AudioOutputPreview instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        /**
         * The internal reference to the DOM/HTML element backing the React
         * {@code Component} audio element. It is necessary for setting the
         * targeted audio output device to play sound from.
         *
         * @private
         * @type {HTMLAudioElement}
         */
        this._audioElement = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onClick = this._onClick.bind(this);
        this._setAudioElement = this._setAudioElement.bind(this);
    }

    /**
     * Sets the target output device on the component's audio element after
     * initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._setAudioSink();
    }

    /**
     * Updates the audio element when the target output device changes and the
     * audio element has re-rendered.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate() {
        this._setAudioSink();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'audio-output-preview'>
                <a onClick = { this._onClick }>
                    { this.props.t('deviceSelection.testAudio') }
                </a>
                <audio
                    preload = 'auto'
                    ref = { this._setAudioElement }
                    src = { TEST_SOUND_PATH } />
            </div>
        );
    }

    /**
     * Plays a test sound.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this._audioElement
        && this._audioElement.play();
    }

    /**
     * Sets the instance variable for the component's audio element so it can be
     * accessed directly.
     *
     * @param {Object} element - The DOM element for the component's audio.
     * @private
     * @returns {void}
     */
    _setAudioElement(element) {
        this._audioElement = element;
    }

    /**
     * Updates the target output device for playing the test sound.
     *
     * @private
     * @returns {void}
     */
    _setAudioSink() {
        this._audioElement
        && this._audioElement.setSinkId(this.props.deviceId);
    }
}

export default translate(AudioOutputPreview);
