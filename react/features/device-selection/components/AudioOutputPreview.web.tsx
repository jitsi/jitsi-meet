import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';
import { Audio } from '../../base/media/components/index';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.any';

const TEST_SOUND_PATH = 'sounds/ring.mp3';

/**
 * The type of the React {@code Component} props of {@link AudioOutputPreview}.
 */
interface IProps extends WithTranslation {

    /**
     * Button className.
     */
    className?: string;

    /**
     * The device id of the audio output device to use.
     */
    deviceId: string;
}

/**
 * React component for playing a test sound through a specified audio device.
 *
 * @augments Component
 */
class AudioOutputPreview extends Component<IProps> {
    _audioElement: HTMLAudioElement | null;

    /**
     * Initializes a new AudioOutputPreview instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._audioElement = null;

        this._audioElementReady = this._audioElementReady.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
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
            <>
                <Button
                    accessibilityLabel = { this.props.t('deviceSelection.testAudio') }
                    className = { this.props.className }
                    labelKey = 'deviceSelection.testAudio'
                    onClick = { this._onClick }
                    onKeyPress = { this._onKeyPress }
                    type = { BUTTON_TYPES.SECONDARY } />
                <Audio
                    setRef = { this._audioElementReady }
                    src = { TEST_SOUND_PATH } />
            </>
        );
    }

    /**
     * Sets the instance variable for the component's audio element so it can be
     * accessed directly.
     *
     * @param {Object} element - The DOM element for the component's audio.
     * @private
     * @returns {void}
     */
    _audioElementReady(element: HTMLAudioElement) {
        this._audioElement = element;

        this._setAudioSink();
    }

    /**
     * Plays a test sound.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this._audioElement?.play();
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onClick();
        }
    }

    /**
     * Updates the target output device for playing the test sound.
     *
     * @private
     * @returns {void}
     */
    _setAudioSink() {
        this._audioElement
            && this.props.deviceId
            && this._audioElement.setSinkId(this.props.deviceId);
    }
}

export default translate(AudioOutputPreview);
