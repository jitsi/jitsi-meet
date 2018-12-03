/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { Audio } from '../../base/media';

const TEST_SOUND_PATH = 'sounds/ring.wav';

/**
 * The type of the React {@code Component} props of {@link AudioOutputPreview}.
 */
type Props = {

    /**
     * The device id of the audio output device to use.
     */
    deviceId: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React component for playing a test sound through a specified audio device.
 *
 * @extends Component
 */
class AudioOutputPreview extends Component<Props> {
    _audioElement: ?Object;

    /**
     * Initializes a new AudioOutputPreview instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._audioElement = null;

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
                <Audio
                    setRef = { this._setAudioElement }
                    src = { TEST_SOUND_PATH } />
            </div>
        );
    }

    _onClick: () => void;

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

    _setAudioElement: (Object) => void;

    /**
     * Sets the instance variable for the component's audio element so it can be
     * accessed directly.
     *
     * @param {Object} element - The DOM element for the component's audio.
     * @private
     * @returns {void}
     */
    _setAudioElement(element: Object) {
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
