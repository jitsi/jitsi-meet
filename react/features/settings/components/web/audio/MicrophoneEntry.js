// @flow

import React, { Component } from 'react';

import AudioSettingsEntry, { type Props as AudioSettingsEntryProps } from './AudioSettingsEntry';
import JitsiMeetJS from '../../../../base/lib-jitsi-meet/_';
import Meter from './Meter';

const JitsiTrackEvents = JitsiMeetJS.events.track;

type Props = AudioSettingsEntryProps & {

    /**
     * The deviceId of the microphone.
     */
    deviceId: string,

    /**
     * Flag indicating if there is a problem with the device.
     */
    hasError?: boolean,

    /**
     * The audio track for the current entry.
     */
    jitsiTrack: Object,

    /**
     * Click handler for component.
     */
    onClick: Function,
}

type State = {

    /**
     * The audio level.
     */
    level: number,
}

/**
 * React {@code Component} representing an entry for the microphone audio settings.
 *
 * @param {Props} props - The props of the component.
 * @returns { ReactElement}
 */
export default class MicrophoneEntry extends Component<Props, State> {
    /**
     * Initializes a new {@code MicrophoneEntry} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            level: -1
        };
        this._onClick = this._onClick.bind(this);
        this._updateLevel = this._updateLevel.bind(this);
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

    _updateLevel: (number) => void;

    /**
     * Updates the level of the meter.
     *
     * @param {number} num - The audio level provided by the jitsiTrack.
     * @returns {void}
     */
    _updateLevel(num) {
        this.setState({
            level: Math.floor(num / 0.125)
        });
    }

    /**
     * Subscribes to audio level chanages comming from the jitsiTrack.
     *
     * @returns {void}
     */
    _startListening() {
        const { jitsiTrack } = this.props;

        jitsiTrack && jitsiTrack.on(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            this._updateLevel);
    }

    /**
     * Unsubscribes from chanages comming from the jitsiTrack.
     *
     * @param {Object} jitsiTrack - The jitsiTrack to unsubscribe from.
     * @returns {void}
     */
    _stopListening(jitsiTrack) {
        jitsiTrack && jitsiTrack.off(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            this._updateLevel);
        this.setState({
            level: -1
        });
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        if (prevProps.jitsiTrack !== this.props.jitsiTrack) {
            this._stopListening(prevProps.jitsiTrack);
            this._startListening();
        }
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._startListening();
    }

    /**
     * Implements React's {@link Component#componentWillUnmount}.
     *
     * @inheritdoc
     */
    compmonentWillUnmount() {
        this._stopListening(this.props.jitsiTrack);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { children, hasError, isSelected } = this.props;

        return (
            <div
                className = 'audio-preview-microphone'
                onClick = { this._onClick }>
                <AudioSettingsEntry
                    hasError = { hasError }
                    isSelected = { isSelected }>
                    {children}
                </AudioSettingsEntry>
                <Meter
                    className = 'audio-preview-meter-mic'
                    isDisabled = { hasError }
                    level = { this.state.level } />
            </div>
        );
    }
}
