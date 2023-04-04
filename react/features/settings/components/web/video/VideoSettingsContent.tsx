import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import { IconImage } from '../../../../base/icons/svg';
import { Video } from '../../../../base/media/components/index';
import { equals } from '../../../../base/redux/functions';
import { updateSettings } from '../../../../base/settings/actions';
import Checkbox from '../../../../base/ui/components/web/Checkbox';
import ContextMenu from '../../../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../../../base/ui/components/web/ContextMenuItemGroup';
import { openSettingsDialog } from '../../../actions';
import { SETTINGS_TABS } from '../../../constants';
import { createLocalVideoTracks } from '../../../functions.web';

const videoClassName = 'video-preview-video flipVideoX';

/**
 * The type of the React {@code Component} props of {@link VideoSettingsContent}.
 */
export interface IProps extends WithTranslation {

    /**
     * Callback to change the flip state.
     */
    changeFlip: (flip: boolean) => void;

    /**
     * The deviceId of the camera device currently being used.
     */
    currentCameraDeviceId: string;

    /**
     * Whether or not the local video is flipped.
     */
    localFlipX: boolean;

    /**
     * Open virtual background dialog.
     */
    selectBackground: () => void;

    /**
     * Callback invoked to change current camera.
     */
    setVideoInputDevice: Function;

    /**
     * Callback invoked to toggle the settings popup visibility.
     */
    toggleVideoSettings: Function;

    /**
     * All the camera device ids currently connected.
     */
    videoDeviceIds: string[];
}

/**
 * The type of the React {@code Component} state of {@link VideoSettingsContent}.
 */
interface IState {

    /**
     * An array of all the jitsiTracks and eventual errors.
     */
    trackData: { deviceId: string; error?: string; jitsiTrack: any | null; }[];
}

/**
 * Implements a React {@link Component} which displays a list of video
 * previews to choose from.
 *
 * @augments Component
 */
class VideoSettingsContent extends Component<IProps, IState> {
    _componentWasUnmounted: boolean;

    /**
     * Initializes a new {@code VideoSettingsContent} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);
        this._onToggleFlip = this._onToggleFlip.bind(this);

        this.state = {
            trackData: new Array(props.videoDeviceIds.length).fill({
                jitsiTrack: null
            })
        };
    }

    /**
     * Toggles local video flip state.
     *
     * @returns {void}
     */
    _onToggleFlip() {
        const { localFlipX, changeFlip } = this.props;

        changeFlip(!localFlipX);
    }

    /**
     * Creates and updates the track data.
     *
     * @returns {void}
     */
    async _setTracks() {
        this._disposeTracks(this.state.trackData);

        const trackData = await createLocalVideoTracks(this.props.videoDeviceIds, 5000);

        // In case the component gets unmounted before the tracks are created
        // avoid a leak by not setting the state
        if (this._componentWasUnmounted) {
            this._disposeTracks(trackData);
        } else {
            this.setState({
                trackData
            });
        }
    }

    /**
     * Destroys all the tracks from trackData object.
     *
     * @param {Object[]} trackData - An array of tracks that are to be disposed.
     * @returns {Promise<void>}
     */
    _disposeTracks(trackData: { jitsiTrack: any; }[]) {
        trackData.forEach(({ jitsiTrack }) => {
            jitsiTrack?.dispose();
        });
    }

    /**
     * Returns the click handler used when selecting the video preview.
     *
     * @param {string} deviceId - The id of the camera device.
     * @returns {Function}
     */
    _onEntryClick(deviceId: string) {
        return () => {
            this.props.setVideoInputDevice(deviceId);
            this.props.toggleVideoSettings();
        };
    }

    /**
     * Renders a preview entry.
     *
     * @param {Object} data - The track data.
     * @param {number} index - The index of the entry.
     * @returns {React$Node}
     */
    _renderPreviewEntry(data: { deviceId: string; error?: string; jitsiTrack: any | null; }, index: number) {
        const { error, jitsiTrack, deviceId } = data;
        const { currentCameraDeviceId, t } = this.props;
        const isSelected = deviceId === currentCameraDeviceId;
        const key = `vp-${index}`;
        const className = 'video-preview-entry';
        const tabIndex = '0';

        if (error) {
            return (
                <div
                    className = { className }
                    key = { key }
                    tabIndex = { -1 } >
                    <div className = 'video-preview-error'>{t(error)}</div>
                </div>
            );
        }

        const props: any = {
            className,
            key,
            tabIndex
        };
        const label = jitsiTrack?.getTrackLabel();

        if (isSelected) {
            props['aria-checked'] = true;
            props.className = `${className} video-preview-entry--selected`;
        } else {
            props.onClick = this._onEntryClick(deviceId);
            props.onKeyPress = (e: React.KeyboardEvent) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    props.onClick();
                }
            };
        }

        return (
            <div
                { ...props }
                role = 'radio'>
                <div className = 'video-preview-label'>
                    {label && <div className = 'video-preview-label-text'>
                        <span>{label}</span>
                    </div>}
                </div>
                <Video
                    className = { videoClassName }
                    playsinline = { true }
                    videoTrack = {{ jitsiTrack }} />
            </div>
        );
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
        this._disposeTracks(this.state.trackData);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: IProps) {
        if (!equals(this.props.videoDeviceIds, prevProps.videoDeviceIds)) {
            this._setTracks();
        }
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { trackData } = this.state;
        const { selectBackground, t, localFlipX } = this.props;

        return (
            <ContextMenu
                aria-labelledby = 'video-settings-button'
                className = 'video-preview-container'
                hidden = { false }
                id = 'video-settings-dialog'
                role = 'radiogroup'
                tabIndex = { -1 }>
                <ContextMenuItemGroup>
                    {trackData.map((data, i) => this._renderPreviewEntry(data, i))}
                </ContextMenuItemGroup>
                <ContextMenuItemGroup>
                    <ContextMenuItem
                        accessibilityLabel = 'virtualBackground.title'
                        icon = { IconImage }
                        onClick = { selectBackground }
                        text = { t('virtualBackground.title') } />
                    <div
                        className = 'video-preview-checkbox-container'
                        // eslint-disable-next-line react/jsx-no-bind
                        onClick = { e => e.stopPropagation() }>
                        <Checkbox
                            checked = { localFlipX }
                            label = { t('videothumbnail.mirrorVideo') }
                            onChange = { this._onToggleFlip } />
                    </div>
                </ContextMenuItemGroup>
            </ContextMenu>
        );
    }
}

const mapStateToProps = (state: IReduxState) => {
    const { localFlipX } = state['features/base/settings'];

    return {
        localFlipX: Boolean(localFlipX)
    };
};

const mapDispatchToProps = (dispatch: IStore['dispatch']) => {
    return {
        selectBackground: () => dispatch(openSettingsDialog(SETTINGS_TABS.VIRTUAL_BACKGROUND)),
        changeFlip: (flip: boolean) => {
            dispatch(updateSettings({
                localFlipX: flip
            }));
        }
    };
};

export default translate(connect(mapStateToProps, mapDispatchToProps)(VideoSettingsContent));
