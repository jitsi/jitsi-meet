import { Theme } from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import { isAdvancedAudioSettingsEnabled } from '../../base/config/functions.any';
import { getAvailableDevices } from '../../base/devices/actions.web';
import AbstractDialogTab, {
    type IProps as AbstractDialogTabProps
} from '../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../base/i18n/functions';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions.web';
import { IAudioSettings } from '../../base/settings/reducer';
import Checkbox from '../../base/ui/components/web/Checkbox';
import { setPreviewAudioTrack } from '../../settings/actions.web';
import { disposeTrack } from '../../settings/functions.web';
import { iAmVisitor as iAmVisitorCheck } from '../../visitors/functions';
import logger from '../logger';

import AudioInputPreview from './AudioInputPreview.web';
import AudioOutputPreview from './AudioOutputPreview.web';
import DeviceHidContainer from './DeviceHidContainer.web';
import DeviceSelector from './DeviceSelector.web';


/**
 * The type of the React {@code Component} props of {@link AudioDevicesSelection}.
 */
interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * The audio local track settings.
     */
    audioSettings?: IAudioSettings;

    /**
     * All known audio and video devices split by type. This prop comes from
     * the app state.
     */
    availableDevices: {
        audioInput?: MediaDeviceInfo[];
        audioOutput?: MediaDeviceInfo[];
    };

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * Whether or not the audio selector can be interacted with. If true,
     * the audio input selector will be rendered as disabled. This is
     * specifically used to prevent audio device changing in Firefox, which
     * currently does not work due to a browser-side regression.
     */
    disableAudioInputChange: boolean;

    /**
     * True if device changing is configured to be disallowed. Selectors
     * will display as disabled.
     */
    disableDeviceChange: boolean;

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not the audio permission was granted.
     */
    hasAudioPermission: boolean;

    /**
     * If true, the audio meter will not display. Necessary for browsers or
     * configurations that do not support local stats to prevent a
     * non-responsive mic preview from displaying.
     */
    hideAudioInputPreview: boolean;

    /**
     * If true, the button to play a test sound on the selected speaker will not be displayed.
     * This needs to be hidden on browsers that do not support selecting an audio output device.
     */
    hideAudioOutputPreview: boolean;

    /**
     * Whether or not the audio output source selector should display. If
     * true, the audio output selector and test audio link will not be
     * rendered.
     */
    hideAudioOutputSelect: boolean;

    /**
     * Whether or not the hid device container should display.
     */
    hideDeviceHIDContainer: boolean;

    /**
     * Whether to hide noise suppression checkbox or not.
     */
    hideNoiseSuppression: boolean;

    /**
     * Whether we are in visitors mode.
     */
    iAmVisitor: boolean;

    /**
     * Whether the advanced audio settings are enabled from config.
     */
    isAdvancedAudioSettingsConfigEnabled: boolean;

    /**
     * Whether noise suppression is on or not.
     */
    noiseSuppressionEnabled: boolean;

    /**
     * The audio track that is used for previewing the audio input.
     */
    previewAudioTrack: any | null;

    /**
     * The id of the audio input device to preview.
     */
    selectedAudioInputId: string;

    /**
     * The id of the audio output device to preview.
     */
    selectedAudioOutputId: string;
}


const styles = (theme: Theme) => {
    return {
        checkbox: {
            width: 'max-content'
        },

        checkboxGrid: {
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            gap: theme.spacing(3),
            margin: `${theme.spacing(3)} 0`
        },

        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '0 2px',
            width: '100%'
        },

        hidden: {
            display: 'none'
        },

        inputContainer: {
            marginBottom: theme.spacing(3)
        },

        outputContainer: {
            display: 'flex',
            alignItems: 'flex-end',
            margin: `${theme.spacing(5)} 0`
        },

        outputButton: {
            marginLeft: theme.spacing(3)
        }
    };
};


/**
 * React {@code Component} for previewing audio and video input/output devices.
 *
 * @augments Component
 */
class AudioDevicesSelection extends AbstractDialogTab<IProps, {}> {

    /**
     * Whether current component is mounted or not.
     *
     * In component did mount we start a Promise to create tracks and
     * set the tracks in the state, if we unmount the component in the meanwhile
     * tracks will be created and will never been disposed (dispose tracks is
     * in componentWillUnmount). When tracks are created and component is
     * unmounted we dispose the tracks.
     */
    _unMounted: boolean;

    /**
     * Initializes a new DeviceSelection instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._unMounted = true;
    }

    /**
     * Generate the initial previews for audio input and video input.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        this._unMounted = false;
        Promise.all([
            this._createAudioInputTrack(this.props.selectedAudioInputId)
        ])
            .catch(err => logger.warn('Failed to initialize preview tracks', err))
            .then(() => {
                this.props.dispatch(getAvailableDevices());
            });
    }

    /**
     * Checks if audio / video permissions were granted. Updates audio input and
     * video input previews.
     *
     * @param {Object} prevProps - Previous props this component received.
     * @returns {void}
     */
    override componentDidUpdate(prevProps: IProps) {
        if (prevProps.selectedAudioInputId
            !== this.props.selectedAudioInputId) {
            this._createAudioInputTrack(this.props.selectedAudioInputId);
        }
    }

    /**
     * Ensure preview tracks are destroyed to prevent continued use.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._unMounted = true;
        disposeTrack(this.props.previewAudioTrack);
    }

    /**
     * Toggles the audio settings based on the input change event and updates the state.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onToggleAudioSettings = ({ target: { checked, name } }: React.ChangeEvent<HTMLInputElement>) => {
        const { audioSettings } = this.props;

        const newValue = name === 'channelCount' ? (checked ? 2 : 1) : checked;

        if (name === 'channelCount' && newValue === 2) {
            super._onChange({
                audioSettings: {
                    autoGainControl: false,
                    channelCount: 2,
                    echoCancellation: false,
                    noiseSuppression: false
                }
            });

            return;
        } else if (name !== 'channelCount' && newValue === true) {
            super._onChange({
                audioSettings: {
                    ...audioSettings,
                    [name]: newValue,
                    channelCount: 1
                }
            });

            return;
        }

        super._onChange({
            audioSettings: {
                ...audioSettings,
                [name]: newValue
            }
        });
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const {
            audioSettings,
            hasAudioPermission,
            hideAudioInputPreview,
            hideAudioOutputPreview,
            hideDeviceHIDContainer,
            hideNoiseSuppression,
            isAdvancedAudioSettingsConfigEnabled,
            iAmVisitor,
            noiseSuppressionEnabled,
            selectedAudioOutputId,
            t
        } = this.props;
        const { audioInput, audioOutput } = this._getSelectors();

        const classes = withStyles.getClasses(this.props);

        const isAudioSettingsEnabled = Boolean(audioSettings?.autoGainControl || audioSettings?.channelCount === 2 || audioSettings?.echoCancellation || audioSettings?.noiseSuppression);

        const shouldDisplayNoiseSuppressionCheckbox = !hideNoiseSuppression && !iAmVisitor;
        const shouldDisplayAdvancedAudioSettingsCheckboxes = !hideNoiseSuppression && !iAmVisitor && isAdvancedAudioSettingsConfigEnabled && Boolean(audioSettings);

        const shouldDisabledNoiseSupressionCheckbox = shouldDisplayAdvancedAudioSettingsCheckboxes && (isAudioSettingsEnabled && !noiseSuppressionEnabled);

        return (
            <div className = { classes.container }>
                {!iAmVisitor && <div
                    aria-live = 'polite'
                    className = { classes.inputContainer }>
                    {this._renderSelector(audioInput)}
                </div>}

                {!hideAudioInputPreview && hasAudioPermission && !iAmVisitor
                                    && <AudioInputPreview
                                        track = { this.props.previewAudioTrack } />}

                <fieldset className = { classes.checkboxGrid }>
                    <Checkbox
                        checked = { Boolean(audioSettings?.echoCancellation) }
                        className = { clsx(classes.checkbox, {
                            [classes.hidden]: !shouldDisplayAdvancedAudioSettingsCheckboxes,
                        }) }
                        disabled = { noiseSuppressionEnabled }
                        label = { t('toolbar.advancedAudioSettings.aec.label') }
                        name = { 'echoCancellation' }
                        onChange = { this._onToggleAudioSettings } />
                    <Checkbox
                        checked = { Boolean(audioSettings?.channelCount === 2) }
                        className = { clsx(classes.checkbox, {
                            [classes.hidden]: !shouldDisplayAdvancedAudioSettingsCheckboxes,
                        }) }
                        disabled = { noiseSuppressionEnabled }
                        label = { t('toolbar.advancedAudioSettings.stereo.label') }
                        name = { 'channelCount' }
                        onChange = { this._onToggleAudioSettings } />
                    <Checkbox
                        checked = { Boolean(audioSettings?.autoGainControl) }
                        className = { clsx(classes.checkbox, {
                            [classes.hidden]: !shouldDisplayAdvancedAudioSettingsCheckboxes,
                        }) }
                        disabled = { noiseSuppressionEnabled }
                        label = { t('toolbar.advancedAudioSettings.agc.label') }
                        name = { 'autoGainControl' }
                        onChange = { this._onToggleAudioSettings } />
                    <Checkbox
                        checked = { Boolean(audioSettings?.noiseSuppression) }
                        className = { clsx(classes.checkbox, {
                            [classes.hidden]: !shouldDisplayAdvancedAudioSettingsCheckboxes,
                        }) }
                        disabled = { noiseSuppressionEnabled }
                        label = { t('toolbar.advancedAudioSettings.ns.label') }
                        name = { 'noiseSuppression' }
                        onChange = { this._onToggleAudioSettings } />
                    <Checkbox
                        checked = { noiseSuppressionEnabled }
                        className = { clsx(classes.checkbox, {
                            [classes.hidden]: !shouldDisplayNoiseSuppressionCheckbox,
                        }) }
                        disabled = { shouldDisabledNoiseSupressionCheckbox }
                        label = { t('toolbar.enableNoiseSuppression') }
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = { () => super._onChange({
                            noiseSuppressionEnabled: !noiseSuppressionEnabled
                        }) } />
                </fieldset>
                <div
                    aria-live = 'polite'
                    className = { classes.outputContainer }>
                    {this._renderSelector(audioOutput)}
                    {!hideAudioOutputPreview && hasAudioPermission
                        && <AudioOutputPreview
                            className = { classes.outputButton }
                            deviceId = { selectedAudioOutputId } />}
                </div>

                {!hideDeviceHIDContainer && !iAmVisitor
                    && <DeviceHidContainer />}
            </div>
        );
    }

    /**
     * Creates the JitsiTrack for the audio input preview.
     *
     * @param {string} deviceId - The id of audio input device to preview.
     * @private
     * @returns {void}
     */
    _createAudioInputTrack(deviceId: string) {
        const { hideAudioInputPreview, previewAudioTrack } = this.props;

        if (hideAudioInputPreview) {
            return;
        }

        return disposeTrack(previewAudioTrack)
            .then(() => createLocalTrack('audio', deviceId, 5000))
            .then(jitsiLocalTrack => {
                if (this._unMounted) {
                    jitsiLocalTrack.dispose();

                    return;
                }
                this.props.dispatch(setPreviewAudioTrack(jitsiLocalTrack));

            })
            .catch(() => {
                this.props.dispatch(setPreviewAudioTrack(null));
            });
    }

    /**
     * Creates a DeviceSelector instance based on the passed in configuration.
     *
     * @private
     * @param {Object} deviceSelectorProps - The props for the DeviceSelector.
     * @returns {ReactElement}
     */
    _renderSelector(deviceSelectorProps: any) {
        return deviceSelectorProps ? (
            <DeviceSelector
                { ...deviceSelectorProps }
                key = { deviceSelectorProps.id } />
        ) : null;
    }

    /**
     * Returns object configurations for audio input and output.
     *
     * @private
     * @returns {Object} Configurations.
     */
    _getSelectors() {
        const { availableDevices, hasAudioPermission } = this.props;

        const audioInput = {
            devices: availableDevices.audioInput,
            hasPermission: hasAudioPermission,
            icon: 'icon-microphone',
            isDisabled: this.props.disableAudioInputChange || this.props.disableDeviceChange,
            key: 'audioInput',
            id: 'audioInput',
            label: 'settings.selectMic',
            onSelect: (selectedAudioInputId: string) => super._onChange({ selectedAudioInputId }),
            selectedDeviceId: this.props.previewAudioTrack
                ? this.props.previewAudioTrack.getDeviceId() : this.props.selectedAudioInputId
        };
        let audioOutput;

        if (!this.props.hideAudioOutputSelect) {
            audioOutput = {
                devices: availableDevices.audioOutput,
                hasPermission: hasAudioPermission,
                icon: 'icon-speaker',
                isDisabled: this.props.disableDeviceChange,
                key: 'audioOutput',
                id: 'audioOutput',
                label: 'settings.selectAudioOutput',
                onSelect: (selectedAudioOutputId: string) => super._onChange({ selectedAudioOutputId }),
                selectedDeviceId: this.props.selectedAudioOutputId
            };
        }

        return { audioInput,
            audioOutput };
    }
}

const mapStateToProps = (state: IReduxState) => {
    return {
        availableDevices: state['features/base/devices'].availableDevices ?? {},
        isAdvancedAudioSettingsConfigEnabled: isAdvancedAudioSettingsEnabled(state),
        iAmVisitor: iAmVisitorCheck(state),
        previewAudioTrack: state['features/settings'].previewAudioTrack
    };
};

export default connect(mapStateToProps)(withStyles(translate(AudioDevicesSelection), styles));
