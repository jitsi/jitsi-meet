import { Theme } from '@mui/material';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../app/types';
import { getAvailableDevices } from '../../base/devices/actions.web';
import AbstractDialogTab, {
    type IProps as AbstractDialogTabProps
} from '../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../base/i18n/functions';
import { createLocalTrack } from '../../base/lib-jitsi-meet/functions.web';
import Tooltip from '../../base/tooltip/components/Tooltip';
import { IAudioSettings } from '../../base/tracks/actions.web';
import Checkbox from '../../base/ui/components/web/Checkbox';
import { setAudioPreviewTrack } from '../../settings/actions.web';
import { disposeAudioInputPreview } from '../../settings/functions.web';
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
     * The audio settings that are used for the audio input preview.
     */
    audioSettings: IAudioSettings;

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
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '0 2px',
            width: '100%'
        },

        inputContainer: {
            marginBottom: theme.spacing(3)
        },

        outputContainer: {
            margin: `${theme.spacing(5)} 0`,
            display: 'flex',
            alignItems: 'flex-end'
        },

        outputButton: {
            marginLeft: theme.spacing(3)
        },

        noiseSuppressionContainer: {
            marginBottom: theme.spacing(5)
        },

        checkbox: {
            marginTop: theme.spacing(3),
            marginBottom: theme.spacing(1),
            width: 'fit-content',
        },
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
        disposeAudioInputPreview(this.props.previewAudioTrack);
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
            iAmVisitor,
            noiseSuppressionEnabled,
            selectedAudioOutputId,
            t
        } = this.props;
        const { audioInput, audioOutput } = this._getSelectors();

        const classes = withStyles.getClasses(this.props);

        const isAudioSettingsEnabled = Boolean(audioSettings?.autoGainControl || audioSettings?.channelCount === 2 || audioSettings?.echoCancellation || audioSettings?.noiseSuppression);

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


                {audioSettings && !hideNoiseSuppression && !iAmVisitor && (
                    <fieldset className = { classes.container }>
                     <Tooltip
                            containerClassName = { classes.checkbox }
                            content = { 'Tooltip' }
                            position = { 'right' }>
                            <Checkbox
                                checked = { audioSettings.echoCancellation }
                                disabled = { noiseSuppressionEnabled }
                                label = { 'Echo cancellation' }
                                name = { 'echoCancellation' }
                                onChange = { this._onToggleAudioSettings } />
                        </Tooltip>

                        <Tooltip
                            containerClassName = { classes.checkbox }
                            content = { 'Tooltip' }
                            position = { 'right' }>
                            <Checkbox
                                checked = { audioSettings.autoGainControl }
                                disabled = { noiseSuppressionEnabled }
                                label = { 'Automatic gain control' }
                                name = { 'autoGainControl' }
                                onChange = { this._onToggleAudioSettings } />
                        </Tooltip>

                        <Tooltip
                            containerClassName = { classes.checkbox }
                            content = { 'Tooltip' }
                            position = { 'right' }>
                            <Checkbox
                                checked = { audioSettings.noiseSuppression }
                                disabled = { noiseSuppressionEnabled }
                                label = { 'Noise suppression' }
                                name = { 'noiseSuppression' }
                                onChange = { this._onToggleAudioSettings } />
                        </Tooltip>

                        <Tooltip
                            containerClassName = { classes.checkbox }
                            content = { 'Tooltip' }
                            position = { 'right' }>
                            <Checkbox
                                checked = { audioSettings.channelCount === 2 }
                                disabled = { noiseSuppressionEnabled }
                                label = { 'Stereo' }
                                name = { 'channelCount' }
                                onChange = { this._onToggleAudioSettings } />
                        </Tooltip>

                        <Tooltip
                            containerClassName = { classes.checkbox }
                            content = { 'Tooltip' }
                            position = { 'right' }>
                            <Checkbox
                                checked = { noiseSuppressionEnabled }
                                disabled = { isAudioSettingsEnabled && !noiseSuppressionEnabled }
                                label = { t('toolbar.enableNoiseSuppression') }
                                // eslint-disable-next-line react/jsx-no-bind
                                onChange = { () => super._onChange({
                                    noiseSuppressionEnabled: !noiseSuppressionEnabled
                                }) } />
                        </Tooltip>
                    </fieldset>
                )}
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

        return disposeAudioInputPreview(previewAudioTrack)
            .then(() => createLocalTrack('audio', deviceId, 5000))
            .then(jitsiLocalTrack => {
                if (this._unMounted) {
                    jitsiLocalTrack.dispose();

                    return;
                }

                this.props.dispatch(setAudioPreviewTrack(jitsiLocalTrack));
            })
            .catch(() => {
                this.props.dispatch(setAudioPreviewTrack(null));
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
        iAmVisitor: iAmVisitorCheck(state),
        previewAudioTrack: state['features/settings'].previewAudioTrack
    };
};

export default connect(mapStateToProps)(withStyles(translate(AudioDevicesSelection), styles));
