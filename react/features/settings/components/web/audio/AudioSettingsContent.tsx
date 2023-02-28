import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import { IconMic, IconVolumeUp } from '../../../../base/icons/svg';
import JitsiMeetJS from '../../../../base/lib-jitsi-meet';
import { equals } from '../../../../base/redux/functions';
import Checkbox from '../../../../base/ui/components/web/Checkbox';
import ContextMenu from '../../../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../../../base/ui/components/web/ContextMenuItemGroup';
import { toggleNoiseSuppression } from '../../../../noise-suppression/actions';
import { isNoiseSuppressionEnabled } from '../../../../noise-suppression/functions';
import { isPrejoinPageVisible } from '../../../../prejoin/functions';
import { createLocalAudioTracks } from '../../../functions.web';

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
function transformDefaultDeviceLabel(deviceId: string, label: string, t: Function) {
    return deviceId === 'default'
        ? t('settings.sameAsSystem', { label: label.replace('Default - ', '') })
        : label;
}

export interface IProps extends WithTranslation {

    /**
    * The deviceId of the microphone in use.
    */
    currentMicDeviceId: string;

    /**
    * The deviceId of the output device in use.
    */
    currentOutputDeviceId?: string;

    /**
    * Used to decide whether to measure audio levels for microphone devices.
    */
    measureAudioLevels: boolean;

    /**
    * A list with objects containing the labels and deviceIds
    * of all the input devices.
    */
    microphoneDevices: Array<{ deviceId: string; label: string; }>;

    /**
     * Whether noise suppression is enabled or not.
     */
    noiseSuppressionEnabled: boolean;

    /**
    * A list of objects containing the labels and deviceIds
    * of all the output devices.
    */
    outputDevices: Array<{ deviceId: string; label: string; }>;

    /**
     * Whether the prejoin page is visible or not.
     */
    prejoinVisible: boolean;

    /**
    * Used to set a new microphone as the current one.
    */
    setAudioInputDevice: Function;

    /**
    * Used to set a new output device as the current one.
    */
    setAudioOutputDevice: Function;

    /**
     * Function to toggle noise suppression.
     */
    toggleSuppression: () => void;
}

type State = {

    /**
    * An list of objects, each containing the microphone label, audio track, device id
    * and track error if the case.
    */
    audioTracks: Array<{ deviceId: string; hasError: boolean; jitsiTrack: any; label: string; }>;
};

/**
 * Implements a React {@link Component} which displays a list of all
 * the audio input & output devices to choose from.
 *
 * @augments Component
 */
class AudioSettingsContent extends Component<IProps, State> {
    _componentWasUnmounted: boolean;
    microphoneHeaderId = 'microphone_settings_header';
    speakerHeaderId = 'speaker_settings_header';


    /**
     * Initializes a new {@code AudioSettingsContent} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._onMicrophoneEntryClick = this._onMicrophoneEntryClick.bind(this);
        this._onSpeakerEntryClick = this._onSpeakerEntryClick.bind(this);

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

    /**
     * Click handler for the microphone entries.
     *
     * @param {string} deviceId - The deviceId for the clicked microphone.
     * @returns {void}
     */
    _onMicrophoneEntryClick(deviceId: string) {
        this.props.setAudioInputDevice(deviceId);
    }

    /**
     * Click handler for the speaker entries.
     *
     * @param {string} deviceId - The deviceId for the clicked speaker.
     * @returns {void}
     */
    _onSpeakerEntryClick(deviceId: string) {
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
    _renderMicrophoneEntry(data: { deviceId: string; hasError: boolean; jitsiTrack: any; label: string; },
            index: number, length: number, t: Function) {
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
                measureAudioLevels = { this.props.measureAudioLevels }
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
    _renderSpeakerEntry(data: { deviceId: string; label: string; }, index: number, length: number, t: Function) {
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
    _disposeTracks(audioTracks: Array<{ jitsiTrack: any; }>) {
        audioTracks.forEach(({ jitsiTrack }) => {
            jitsiTrack?.dispose();
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
    componentDidUpdate(prevProps: IProps) {
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
        const { outputDevices, t, noiseSuppressionEnabled, toggleSuppression, prejoinVisible } = this.props;

        return (
            <ContextMenu
                aria-labelledby = 'audio-settings-button'
                className = 'audio-preview-content'
                hidden = { false }
                id = 'audio-settings-dialog'
                tabIndex = { -1 }>
                <ContextMenuItemGroup>
                    <ContextMenuItem
                        accessibilityLabel = { t('settings.microphones') }
                        className = 'audio-preview-header'
                        icon = { IconMic }
                        id = { this.microphoneHeaderId }
                        text = { t('settings.microphones') } />
                    <ul
                        aria-labelledby = { this.microphoneHeaderId }
                        className = 'audio-preview-content-ul'
                        role = 'radiogroup'
                        tabIndex = { -1 }>
                        {this.state.audioTracks.map((data, i) =>
                            this._renderMicrophoneEntry(data, i, this.state.audioTracks.length, t)
                        )}
                    </ul>
                </ContextMenuItemGroup>
                { outputDevices.length > 0 && (
                    <ContextMenuItemGroup>
                        <ContextMenuItem
                            accessibilityLabel = { t('settings.speakers') }
                            className = 'audio-preview-header'
                            icon = { IconVolumeUp }
                            id = { this.speakerHeaderId }
                            text = { t('settings.speakers') } />
                        <ul
                            aria-labelledby = { this.speakerHeaderId }
                            className = 'audio-preview-content-ul'
                            role = 'radiogroup'
                            tabIndex = { -1 }>
                            { outputDevices.map((data, i) =>
                                this._renderSpeakerEntry(data, i, outputDevices.length, t)
                            )}
                        </ul>
                    </ContextMenuItemGroup>)
                }
                {!prejoinVisible && (
                    <ContextMenuItemGroup>
                        <div
                            className = 'audio-preview-checkbox-container'
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick = { e => e.stopPropagation() }>
                            <Checkbox
                                checked = { noiseSuppressionEnabled }
                                label = { t('toolbar.noiseSuppression') }
                                onChange = { toggleSuppression } />
                        </div>
                    </ContextMenuItemGroup>
                )}
            </ContextMenu>
        );
    }
}

const mapStateToProps = (state: IReduxState) => {
    return {
        noiseSuppressionEnabled: isNoiseSuppressionEnabled(state),
        prejoinVisible: isPrejoinPageVisible(state)
    };
};

const mapDispatchToProps = (dispatch: IStore['dispatch']) => {
    return {
        toggleSuppression() {
            dispatch(toggleNoiseSuppression());
        }
    };
};

export default translate(connect(mapStateToProps, mapDispatchToProps)(AudioSettingsContent));
