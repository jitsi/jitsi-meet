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
import Checkbox from '../../base/ui/components/web/Checkbox';
import Select from '../../base/ui/components/web/Select';
import { SS_DEFAULT_FRAME_RATE } from '../../settings/constants';
import logger from '../logger';

import DeviceSelector from './DeviceSelector.web';
import VideoInputPreview from './VideoInputPreview';

/**
 * The type of the React {@code Component} props of {@link VideoDeviceSelection}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * All known audio and video devices split by type. This prop comes from
     * the app state.
     */
    availableDevices: { videoInput?: MediaDeviceInfo[]; };

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * The currently selected desktop share frame rate in the frame rate select dropdown.
     */
    currentFramerate: string;

    /**
     * All available desktop capture frame rates.
     */
    desktopShareFramerates: Array<number>;

    /**
     * True if desktop share settings should be hidden (mobile browsers).
     */
    disableDesktopShareSettings: boolean;

    /**
     * True if device changing is configured to be disallowed. Selectors
     * will display as disabled.
     */
    disableDeviceChange: boolean;

    /**
     * Whether the local video can be flipped or not.
     */
    disableLocalVideoFlip: boolean | undefined;

    /**
     * Whether video input dropdown should be enabled or not.
     */
    disableVideoInputSelect: boolean;

    /**
     * Redux dispatch.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not the audio permission was granted.
     */
    hasVideoPermission: boolean;

    /**
     * Whether to hide the additional settings or not.
     */
    hideAdditionalSettings: boolean;

    /**
     * Whether video input preview should be displayed or not.
     * (In the case of iOS Safari).
     */
    hideVideoInputPreview: boolean;

    /**
     * Whether or not the local video is flipped.
     */
    localFlipX: boolean;

    /**
     * The id of the video input device to preview.
     */
    selectedVideoInputId: string;
}

/**
 * The type of the React {@code Component} state of {@link VideoDeviceSelection}.
 */
interface IState {

    /**
     * The JitsiTrack to use for previewing video input.
     */
    previewVideoTrack: any | null;

    /**
     * The error message from trying to use a video input device.
     */
    previewVideoTrackError: string | null;
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            padding: '0 2px',
            width: '100%'
        },

        checkboxContainer: {
            margin: `${theme.spacing(4)} 0`
        }
    };
};

/**
 * React {@code Component} for previewing audio and video input/output devices.
 *
 * @augments Component
 */
class VideoDeviceSelection extends AbstractDialogTab<IProps, IState> {

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

        this.state = {
            previewVideoTrack: null,
            previewVideoTrackError: null
        };
        this._unMounted = true;

        this._onFramerateItemSelect = this._onFramerateItemSelect.bind(this);
    }

    /**
     * Generate the initial previews for audio input and video input.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        this._unMounted = false;
        Promise.all([
            this._createVideoInputTrack(this.props.selectedVideoInputId)
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

        if (prevProps.selectedVideoInputId
            !== this.props.selectedVideoInputId) {
            this._createVideoInputTrack(this.props.selectedVideoInputId);
        }
    }

    /**
     * Ensure preview tracks are destroyed to prevent continued use.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._unMounted = true;
        this._disposeVideoInputPreview();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    override render() {
        const {
            disableDesktopShareSettings,
            disableLocalVideoFlip,
            hideAdditionalSettings,
            hideVideoInputPreview,
            localFlipX,
            t
        } = this.props;

        const classes = withStyles.getClasses(this.props);

        return (
            <div className = { classes.container }>
                { !hideVideoInputPreview
                    && <VideoInputPreview
                        error = { this.state.previewVideoTrackError }
                        localFlipX = { localFlipX }
                        track = { this.state.previewVideoTrack } />
                }
                <div
                    aria-live = 'polite'>
                    {this._renderVideoSelector()}
                </div>
                {!hideAdditionalSettings && (
                    <>
                        {!disableLocalVideoFlip && (
                            <div className = { classes.checkboxContainer }>
                                <Checkbox
                                    checked = { localFlipX }
                                    label = { t('videothumbnail.mirrorVideo') }
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onChange = { () => super._onChange({ localFlipX: !localFlipX }) } />
                            </div>
                        )}
                        {!disableDesktopShareSettings && this._renderFramerateSelect()}
                    </>
                )}
            </div>
        );
    }

    /**
     * Creates the JitsiTrack for the video input preview.
     *
     * @param {string} deviceId - The id of video device to preview.
     * @private
     * @returns {void}
     */
    _createVideoInputTrack(deviceId: string) {
        const { hideVideoInputPreview } = this.props;

        if (hideVideoInputPreview) {
            return;
        }

        return this._disposeVideoInputPreview()
            .then(() => createLocalTrack('video', deviceId, 5000))
            .then(jitsiLocalTrack => {
                if (!jitsiLocalTrack) {
                    return Promise.reject();
                }

                if (this._unMounted) {
                    jitsiLocalTrack.dispose();

                    return;
                }

                this.setState({
                    previewVideoTrack: jitsiLocalTrack,
                    previewVideoTrackError: null
                });
            })
            .catch(() => {
                this.setState({
                    previewVideoTrack: null,
                    previewVideoTrackError:
                        this.props.t('deviceSelection.previewUnavailable')
                });
            });
    }

    /**
     * Utility function for disposing the current video input preview.
     *
     * @private
     * @returns {Promise}
     */
    _disposeVideoInputPreview(): Promise<any> {
        return this.state.previewVideoTrack
            ? this.state.previewVideoTrack.dispose() : Promise.resolve();
    }

    /**
     * Creates a DeviceSelector instance based on the passed in configuration.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderVideoSelector() {
        const { availableDevices, hasVideoPermission } = this.props;

        const videoConfig = {
            devices: availableDevices.videoInput,
            hasPermission: hasVideoPermission,
            icon: 'icon-camera',
            isDisabled: this.props.disableVideoInputSelect || this.props.disableDeviceChange,
            key: 'videoInput',
            id: 'videoInput',
            label: 'settings.selectCamera',
            onSelect: (selectedVideoInputId: string) => super._onChange({ selectedVideoInputId }),
            selectedDeviceId: this.state.previewVideoTrack
                ? this.state.previewVideoTrack.getDeviceId() : this.props.selectedVideoInputId
        };

        return (
            <DeviceSelector
                { ...videoConfig }
                key = { videoConfig.id } />
        );
    }

    /**
     * Callback invoked to select a frame rate from the select dropdown.
     *
     * @param {Object} e - The key event to handle.
     * @private
     * @returns {void}
     */
    _onFramerateItemSelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const frameRate = e.target.value;

        super._onChange({ currentFramerate: frameRate });
    }

    /**
     * Returns the React Element for the desktop share frame rate dropdown.
     *
     * @returns {JSX}
     */
    _renderFramerateSelect() {
        const { currentFramerate, desktopShareFramerates, t } = this.props;
        const frameRateItems = desktopShareFramerates.map((frameRate: number) => {
            return {
                value: frameRate,
                label: `${frameRate} ${t('settings.framesPerSecond')}`
            };
        });

        return (
            <Select
                bottomLabel = { parseInt(currentFramerate, 10) > SS_DEFAULT_FRAME_RATE
                    ? t('settings.desktopShareHighFpsWarning')
                    : t('settings.desktopShareWarning') }
                id = 'more-framerate-select'
                label = { t('settings.desktopShareFramerate') }
                onChange = { this._onFramerateItemSelect }
                options = { frameRateItems }
                value = { currentFramerate } />
        );
    }
}

const mapStateToProps = (state: IReduxState) => {
    return {
        availableDevices: state['features/base/devices'].availableDevices ?? {}
    };
};

export default connect(mapStateToProps)(withStyles(translate(VideoDeviceSelection), styles));
