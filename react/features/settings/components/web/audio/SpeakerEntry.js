// @flow

import React, { Component } from 'react';

import logger from '../../../logger';

import AudioSettingsEntry from './AudioSettingsEntry';
import TestButton from './TestButton';

const TEST_SOUND_PATH = 'sounds/ring.wav';

/**
 * The type of the React {@code Component} props of {@link SpeakerEntry}.
 */
type Props = {

    /**
     * The text label for the entry.
     */
    children: React$Node,

    /**
     * Flag controlling the selection state of the entry.
     */
    isSelected: boolean,

    /**
     * The deviceId of the speaker.
     */
    deviceId: string,

    /**
     * Click handler for the component.
     */
    onClick: Function,
};

/**
 * Implements a React {@link Component} which displays an audio
 * output settings entry. The user can click and play a test sound.
 *
 * @extends Component
 */
export default class SpeakerEntry extends Component<Props> {
    /**
     * A React ref to the HTML element containing the {@code audio} instance.
     */
    audioRef: Object;

    /**
     * Initializes a new {@code SpeakerEntry} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.audioRef = React.createRef();
        this._onTestButtonClick = this._onTestButtonClick.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    _onClick: () => void;

    /**
     * Click handler for the entry.
     *
     * @returns {void}
     */
    _onClick() {
        this.props.onClick(this.props.deviceId);
    }

    _onTestButtonClick: Object => void;

    /**
     * Click handler for Test button.
     * Sets the current audio output id and plays a sound.
     *
     * @param {Object} e - The sythetic event.
     * @returns {void}
     */
    async _onTestButtonClick(e) {
        e.stopPropagation();

        try {
            await this.audioRef.current.setSinkId(this.props.deviceId);
            this.audioRef.current.play();
        } catch (err) {
            logger.log('Could not set sink id', err);
        }
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { children, isSelected, deviceId } = this.props;

        return (
            <div
                className = 'audio-preview-speaker'
                onClick = { this._onClick }>
                <AudioSettingsEntry
                    isSelected = { isSelected }
                    key = { deviceId }>
                    {children}
                </AudioSettingsEntry>
                <TestButton onClick = { this._onTestButtonClick } />
                <audio
                    preload = 'auto'
                    ref = { this.audioRef }
                    src = { TEST_SOUND_PATH } />
            </div>
        );
    }
}
