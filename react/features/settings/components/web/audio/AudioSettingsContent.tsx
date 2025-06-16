/* eslint-disable react/no-multi-comp */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../../app/types';
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

export interface IProps {

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

const useStyles = makeStyles()(theme => {
    return {
        contextMenu: {
            position: 'relative',
            right: 'auto',
            margin: 0,
            marginBottom: theme.spacing(1),
            maxHeight: 'calc(100dvh - 100px)',
            overflow: 'auto',
            width: '300px'
        },

        header: {
            '&:hover': {
                backgroundColor: 'initial',
                cursor: 'initial'
            }
        },

        list: {
            margin: 0,
            padding: 0,
            listStyleType: 'none'
        },

        checkboxContainer: {
            padding: '10px 16px'
        }
    };
});

const AudioSettingsContent = ({
    currentMicDeviceId,
    currentOutputDeviceId,
    measureAudioLevels,
    microphoneDevices,
    noiseSuppressionEnabled,
    outputDevices,
    prejoinVisible,
    setAudioInputDevice,
    setAudioOutputDevice,
    toggleSuppression
}: IProps) => {
    const _componentWasUnmounted = useRef(false);
    const microphoneHeaderId = 'microphone_settings_header';
    const speakerHeaderId = 'speaker_settings_header';
    const { classes } = useStyles();
    const [ audioTracks, setAudioTracks ] = useState(microphoneDevices.map(({ deviceId, label }) => {
        return {
            deviceId,
            hasError: false,
            jitsiTrack: null,
            label
        };
    }));
    const microphoneDevicesRef = useRef(microphoneDevices);
    const { t } = useTranslation();

    /**
     * Click handler for the microphone entries.
     *
     * @param {string} deviceId - The deviceId for the clicked microphone.
     * @returns {void}
     */
    const _onMicrophoneEntryClick = useCallback((deviceId: string) => {
        setAudioInputDevice(deviceId);
    }, [ setAudioInputDevice ]);

    /**
     * Click handler for the speaker entries.
     *
     * @param {string} deviceId - The deviceId for the clicked speaker.
     * @returns {void}
     */
    const _onSpeakerEntryClick = useCallback((deviceId: string) => {
        setAudioOutputDevice(deviceId);
    }, [ setAudioOutputDevice ]);

    /**
     * Renders a single microphone entry.
     *
     * @param {Object} data - An object with the deviceId, jitsiTrack & label of the microphone.
     * @param {number} index - The index of the element, used for creating a key.
     * @param {length} length - The length of the microphone list.
     * @returns {React$Node}
     */
    const _renderMicrophoneEntry = (data: { deviceId: string; hasError: boolean; jitsiTrack: any; label: string; },
            index: number, length: number) => {
        const { deviceId, jitsiTrack, hasError } = data;
        const label = transformDefaultDeviceLabel(deviceId, data.label, t);
        const isSelected = deviceId === currentMicDeviceId;

        return (
            <MicrophoneEntry
                deviceId = { deviceId }
                hasError = { hasError }
                index = { index }
                isSelected = { isSelected }
                jitsiTrack = { jitsiTrack }
                key = { `me-${index}` }
                length = { length }
                measureAudioLevels = { measureAudioLevels }
                onClick = { _onMicrophoneEntryClick }>
                {label}
            </MicrophoneEntry>
        );
    };

    /**
     * Renders a single speaker entry.
     *
     * @param {Object} data - An object with the deviceId and label of the speaker.
     * @param {number} index - The index of the element, used for creating a key.
     * @param {length} length - The length of the speaker list.
     * @returns {React$Node}
     */
    const _renderSpeakerEntry = (data: { deviceId: string; label: string; }, index: number, length: number) => {
        const { deviceId } = data;
        const label = transformDefaultDeviceLabel(deviceId, data.label, t);
        const key = `se-${index}`;
        const isSelected = deviceId === currentOutputDeviceId;

        return (
            <SpeakerEntry
                deviceId = { deviceId }
                index = { index }
                isSelected = { isSelected }
                key = { key }
                length = { length }
                onClick = { _onSpeakerEntryClick }>
                {label}
            </SpeakerEntry>
        );
    };

    /**
     * Disposes the audio tracks.
     *
     * @param {Object} tracks - The object holding the audio tracks.
     * @returns {void}
     */
    const _disposeTracks = (tracks: Array<{ jitsiTrack: any; }>) => {
        tracks.forEach(({ jitsiTrack }) => {
            jitsiTrack?.dispose();
        });
    };

    /**
     * Creates and updates the audio tracks.
     *
     * @returns {void}
     */
    const _setTracks = async () => {
        if (browser.isWebKitBased()) {

            // It appears that at the time of this writing, creating audio tracks blocks the browser's main thread for
            // long time on safari. Wasn't able to confirm which part of track creation does the blocking exactly, but
            // not creating the tracks seems to help and makes the UI much more responsive.
            return;
        }

        _disposeTracks(audioTracks);

        const newAudioTracks = await createLocalAudioTracks(microphoneDevices, 5000);

        if (_componentWasUnmounted.current) {
            _disposeTracks(newAudioTracks);
        } else {
            setAudioTracks(newAudioTracks);
        }
    };

    useEffect(() => {
        _setTracks();

        return () => {
            _componentWasUnmounted.current = true;
            _disposeTracks(audioTracks);
        };
    }, []);

    useEffect(() => {
        if (!equals(microphoneDevices, microphoneDevicesRef.current)) {
            _setTracks();
            microphoneDevicesRef.current = microphoneDevices;
        }
    }, [ microphoneDevices ]);

    return (
        <ContextMenu
            activateFocusTrap = { true }
            aria-labelledby = 'audio-settings-button'
            className = { classes.contextMenu }
            hidden = { false }
            id = 'audio-settings-dialog'
            tabIndex = { -1 }>
            <ContextMenuItemGroup>
                <ContextMenuItem
                    accessibilityLabel = { t('settings.microphones') }
                    className = { classes.header }
                    icon = { IconMic }
                    id = { microphoneHeaderId }
                    text = { t('settings.microphones') } />
                <ul
                    aria-labelledby = { microphoneHeaderId }
                    className = { classes.list }
                    role = 'radiogroup'
                    tabIndex = { -1 }>
                    {audioTracks.map((data, i) =>
                        _renderMicrophoneEntry(data, i, audioTracks.length)
                    )}
                </ul>
            </ContextMenuItemGroup>
            {outputDevices.length > 0 && (
                <ContextMenuItemGroup>
                    <ContextMenuItem
                        accessibilityLabel = { t('settings.speakers') }
                        className = { classes.header }
                        icon = { IconVolumeUp }
                        id = { speakerHeaderId }
                        text = { t('settings.speakers') } />
                    <ul
                        aria-labelledby = { speakerHeaderId }
                        className = { classes.list }
                        role = 'radiogroup'
                        tabIndex = { -1 }>
                        {outputDevices.map((data: any, i: number) =>
                            _renderSpeakerEntry(data, i, outputDevices.length)
                        )}
                    </ul>
                </ContextMenuItemGroup>)
            }
            {!prejoinVisible && (
                <ContextMenuItemGroup>
                    <div
                        className = { classes.checkboxContainer }
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
};

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

export default connect(mapStateToProps, mapDispatchToProps)(AudioSettingsContent);
