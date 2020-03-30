// @flow

import React, { Component } from 'react';

import AudioSettingsHeader from './AudioSettingsHeader';
import { translate } from '../../../../base/i18n';
import { IconMicrophoneEmpty, IconVolumeEmpty } from '../../../../base/icons';
import { createLocalAudioTrack } from '../../../functions';
import MicrophoneEntry from './MicrophoneEntry';
import SpeakerEntry from './SpeakerEntry';

export type Props = {

   /**
    * The deviceId of the microphone in use.
    */
    currentMicDeviceId: string,

   /**
    * The deviceId of the output device in use.
    */
    currentOutputDeviceId: string,

   /**
    * Used to set a new microphone as the current one.
    */
    setAudioInputDevice: Function,

   /**
    * Used to set a new output device as the current one.
    */
    setAudioOutputDevice: Function,

   /**
    * A list of objects containing the labels and deviceIds
    * of all the output devices.
    */
    outputDevices: Object[],

   /**
    * A list with objects containing the labels and deviceIds
    * of all the input devices.
    */
    microphoneDevices: Object[],

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

type State = {

   /**
    * An object containing the jitsiTrack and the error (if the case)
    * for the microphone that is in use.
    */
    currentMicData: Object
}

/**
 * Implements a React {@link Component} which displayes a list of all
 * the audio input & output devices to choose from.
 *
 * @extends Component
 */
class AudioSettingsContent extends Component<Props, State> {
    _componentWasUnmounted: boolean;

    /**
     * Initializes a new {@code AudioSettingsContent} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onMicrophoneEntryClick = this._onMicrophoneEntryClick.bind(this);
        this._onSpeakerEntryClick = this._onSpeakerEntryClick.bind(this);

        this.state = {
            currentMicData: {
                error: false,
                jitsiTrack: null
            }
        };
    }

    _onMicrophoneEntryClick: (string) => void;

    /**
     * Click handler for the microphone entries.
     *
     * @param {string} deviceId - The deviceId for the clicked microphone.
     * @returns {void}
     */
    _onMicrophoneEntryClick(deviceId) {
        this.props.setAudioInputDevice(deviceId);
    }

    _onSpeakerEntryClick: (string) => void;

    /**
     * Click handler for the speaker entries.
     *
     * @param {string} deviceId - The deviceId for the clicked speaker.
     * @returns {void}
     */
    _onSpeakerEntryClick(deviceId) {
        this.props.setAudioOutputDevice(deviceId);
    }

    /**
     * Renders a single microphone entry.
     *
     * @param {Object} data - An object with the deviceId and label of the microphone.
     * @param {number} index - The index of the element, used for creating a key.
     * @returns {React$Node}
     */
    _renderMicrophoneEntry(data, index) {
        const { deviceId, label } = data;
        const key = `me-${index}`;
        const isSelected = deviceId === this.props.currentMicDeviceId;
        let jitsiTrack = null;
        let hasError = false;

        if (isSelected) {
            ({ jitsiTrack, hasError } = this.state.currentMicData);
        }

        return (
            <MicrophoneEntry
                deviceId = { deviceId }
                hasError = { hasError }
                isSelected = { isSelected }
                jitsiTrack = { jitsiTrack }
                key = { key }
                onClick = { this._onMicrophoneEntryClick }>
                {label}
            </MicrophoneEntry>
        );
    }

    /**
     * Renders a single speaker entry.
     *
     * @param {Object} data - An object with the deviceId and label of the speaker.
     * @param {number} index - The index of the element, used for creating a key.
     * @returns {React$Node}
     */
    _renderSpeakerEntry(data, index) {
        const { deviceId, label } = data;
        const key = `se-${index}`;

        return (
            <SpeakerEntry
                deviceId = { deviceId }
                isSelected = { deviceId === this.props.currentOutputDeviceId }
                key = { key }
                onClick = { this._onSpeakerEntryClick }>
                {label}
            </SpeakerEntry>
        );
    }

    /**
     * Disposes the audio track for a given micData object.
     *
     * @param {Object} micData - The object holding the track.
     * @returns {Promise<void>}
     */
    _disposeTrack(micData) {
        const { jitsiTrack } = micData;

        return jitsiTrack ? jitsiTrack.dispose() : Promise.resolve();
    }

    /**
     * Updates the current microphone data.
     * Disposes previously created track and creates a new one.
     *
     * @returns {void}
     */
    async _updateCurrentMicData() {
        await this._disposeTrack(this.state.currentMicData);

        const currentMicData = await createLocalAudioTrack(
            this.props.currentMicDeviceId,
        );

        // In case the component gets unmounted before the track is created
        // avoid a leak by not setting the state
        if (this._componentWasUnmounted) {
            this._disposeTrack(currentMicData);
        } else {
            this.setState({
                currentMicData
            });
        }
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        if (prevProps.currentMicDeviceId !== this.props.currentMicDeviceId) {
            this._updateCurrentMicData();
        }
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updateCurrentMicData();
    }

    /**
     * Implements React's {@link Component#componentWillUnmount}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._componentWasUnmounted = true;
        this._disposeTrack(this.state.currentMicData);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { microphoneDevices, outputDevices, t } = this.props;

        return (
            <div>
                <div className = 'audio-preview-content'>
                    <AudioSettingsHeader
                        IconComponent = { IconMicrophoneEmpty }
                        text = { t('settings.microphones') } />
                    {microphoneDevices.map((data, i) =>
                        this._renderMicrophoneEntry(data, i),
                    )}
                    <AudioSettingsHeader
                        IconComponent = { IconVolumeEmpty }
                        text = { t('settings.speakers') } />
                    {outputDevices.map((data, i) =>
                        this._renderSpeakerEntry(data, i),
                    )}
                </div>
            </div>
        );
    }
}

export default translate(AudioSettingsContent);
