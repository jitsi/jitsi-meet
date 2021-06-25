// @flow

import React, { Component } from 'react';

import { translate } from '../../../../base/i18n';
import { IconMicrophoneHollow, IconVolumeEmpty } from '../../../../base/icons';
import JitsiMeetJS from '../../../../base/lib-jitsi-meet';
import { equals } from '../../../../base/redux';
import { createLocalAudioTracks } from '../../../functions';

import AudioSettingsHeader from './AudioSettingsHeader';
import MicrophoneEntry from './MicrophoneEntry';
import SpeakerEntry from './SpeakerEntry';

const browser = JitsiMeetJS.util.browser;

/**
 * Translates the default device label into a more user friendly one.
 *
 * @param {string} deviceId - The device Id.
 * @param {string} label - The device label.
 * @param {Function} t - The translation function.
 * @returns {string}
 */
function transformDefaultDeviceLabel(deviceId, label, t) {
    return deviceId === 'default'
        ? t('settings.sameAsSystem', { label: label.replace('Default - ', '') })
        : label;
}

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
    * An list of objects, each containing the microphone label, audio track, device id
    * and track error if the case.
    */
    audioTracks: Object[]
}

/**
 * Implements a React {@link Component} which displays a list of all
 * the audio input & output devices to choose from.
 *
 * @extends Component
 */
class AudioSettingsContent extends Component<Props, State> {
    _componentWasUnmounted: boolean;
    _audioContentRef: Object;
    microphoneHeaderId = 'microphone_settings_header';
    speakerHeaderId = 'speaker_settings_header';


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
        this._onEscClick = this._onEscClick.bind(this);
        this._audioContentRef = React.createRef();

        this.state = {
            audioTracks: props.microphoneDevices.map(({ deviceId, label }) => {
                return {
                    deviceId,
                    hasError: false,
                    jitsiTrack: null,
                    label
                };
            })
        };
    }
    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the speaker entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this._audioContentRef.current.style.display = 'none';
        }
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
     * @param {Object} data - An object with the deviceId, jitsiTrack & label of the microphone.
     * @param {number} index - The index of the element, used for creating a key.
     * @param {length} length - The length of the microphone list.
     * @param {Function} t - The translation function.
     * @returns {React$Node}
     */
    _renderMicrophoneEntry(data, index, length, t) {
        const { deviceId, jitsiTrack, hasError } = data;
        const label = transformDefaultDeviceLabel(deviceId, data.label, t);
        const isSelected = deviceId === this.props.currentMicDeviceId;

        return (
            <MicrophoneEntry
                deviceId = { deviceId }
                hasError = { hasError }
                index = { index }
                isSelected = { isSelected }
                jitsiTrack = { jitsiTrack }
                key = { `me-${index}` }
                length = { length }
                listHeaderId = { this.microphoneHeaderId }
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
     * @param {length} length - The length of the speaker list.
     * @param {Function} t - The translation function.
     * @returns {React$Node}
     */
    _renderSpeakerEntry(data, index, length, t) {
        const { deviceId } = data;
        const label = transformDefaultDeviceLabel(deviceId, data.label, t);
        const key = `se-${index}`;
        const isSelected = deviceId === this.props.currentOutputDeviceId;

        return (
            <SpeakerEntry
                deviceId = { deviceId }
                index = { index }
                isSelected = { isSelected }
                key = { key }
                length = { length }
                listHeaderId = { this.speakerHeaderId }
                onClick = { this._onSpeakerEntryClick }>
                {label}
            </SpeakerEntry>
        );
    }

    /**
     * Creates and updates the audio tracks.
     *
     * @returns {void}
     */
    async _setTracks() {
        if (browser.isWebKitBased()) {

            // It appears that at the time of this writing, creating audio tracks blocks the browser's main thread for
            // long time on safari. Wasn't able to confirm which part of track creation does the blocking exactly, but
            // not creating the tracks seems to help and makes the UI much more responsive.
            return;
        }

        this._disposeTracks(this.state.audioTracks);

        const audioTracks = await createLocalAudioTracks(this.props.microphoneDevices, 5000);

        if (this._componentWasUnmounted) {
            this._disposeTracks(audioTracks);
        } else {
            this.setState({
                audioTracks
            });
        }
    }

    /**
     * Disposes the audio tracks.
     *
     * @param {Object} audioTracks - The object holding the audio tracks.
     * @returns {void}
     */
    _disposeTracks(audioTracks) {
        audioTracks.forEach(({ jitsiTrack }) => {
            jitsiTrack && jitsiTrack.dispose();
        });
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._setTracks();
    }

    /**
     * Implements React's {@link Component#componentWillUnmount}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._componentWasUnmounted = true;
        this._disposeTracks(this.state.audioTracks);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        if (!equals(this.props.microphoneDevices, prevProps.microphoneDevices)) {
            this._setTracks();
        }
    }


    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { outputDevices, t } = this.props;

        return (
            <div>
                <div
                    aria-labelledby = 'audio-settings-button'
                    className = 'audio-preview-content'
                    id = 'audio-settings-dialog'
                    onKeyDown = { this._onEscClick }
                    ref = { this._audioContentRef }
                    role = 'menu'
                    tabIndex = { -1 }>
                    <div role = 'menuitem'>
                        <AudioSettingsHeader
                            IconComponent = { IconMicrophoneHollow }
                            id = { this.microphoneHeaderId }
                            text = { t('settings.microphones') } />
                        <ul
                            aria-labelledby = 'microphone_settings_header'
                            className = 'audio-preview-content-ul'
                            role = 'radiogroup'
                            tabIndex = '-1'>
                            {this.state.audioTracks.map((data, i) =>
                                this._renderMicrophoneEntry(data, i, this.state.audioTracks.length, t),
                            )}
                        </ul>
                    </div>
                    { outputDevices.length > 0 && (
                        <div role = 'menuitem'>
                            <hr className = 'audio-preview-hr' />
                            <AudioSettingsHeader
                                IconComponent = { IconVolumeEmpty }
                                id = { this.speakerHeaderId }
                                text = { t('settings.speakers') } />
                            <ul
                                aria-labelledby = 'speaker_settings_header'
                                className = 'audio-preview-content-ul'
                                role = 'radiogroup'
                                tabIndex = '-1'>
                                { outputDevices.map((data, i) =>
                                    this._renderSpeakerEntry(data, i, outputDevices.length, t),
                                )}
                            </ul>
                        </div>)
                    }
                </div>
            </div>
        );
    }
}

export default translate(AudioSettingsContent);
