import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../../app/types';
import { IconImage } from '../../../../base/icons/svg';
import { Video } from '../../../../base/media/components/index';
import { equals } from '../../../../base/redux/functions';
import { updateSettings } from '../../../../base/settings/actions';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import Checkbox from '../../../../base/ui/components/web/Checkbox';
import ContextMenu from '../../../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../../../base/ui/components/web/ContextMenuItemGroup';
import { checkBlurSupport, checkVirtualBackgroundEnabled } from '../../../../virtual-background/functions';
import { openSettingsDialog } from '../../../actions';
import { SETTINGS_TABS } from '../../../constants';
import { createLocalVideoTracks } from '../../../functions.web';

/**
 * The type of the React {@code Component} props of {@link VideoSettingsContent}.
 */
export interface IProps {

    /**
     * Callback to change the flip state.
     */
    changeFlip: (flip: boolean) => void;

    /**
     * The deviceId of the camera device currently being used.
     */
    currentCameraDeviceId: string;

    /**
     * Whether the local video flip is disabled.
     */
    disableLocalVideoFlip: boolean | undefined;

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

    /**
    * Whether or not the virtual background is visible.
    */
    visibleVirtualBackground: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            maxHeight: 'calc(100dvh - 100px)',
            overflow: 'auto',
            margin: 0,
            marginBottom: theme.spacing(1),
            position: 'relative',
            right: 'auto'
        },

        previewEntry: {
            cursor: 'pointer',
            height: '138px',
            width: '244px',
            position: 'relative',
            margin: '0 7px',
            marginBottom: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
            boxSizing: 'border-box',
            overflow: 'hidden',

            '&:last-child': {
                marginBottom: 0
            }
        },

        selectedEntry: {
            border: `2px solid ${theme.palette.action01Hover}`
        },

        previewVideo: {
            height: '100%',
            width: '100%',
            objectFit: 'cover'
        },

        error: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            position: 'absolute'
        },

        labelContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: '100%',
            zIndex: 2,
            padding: theme.spacing(2)
        },

        label: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.labelBold),
            width: 'fit-content',
            maxwidth: `calc(100% - ${theme.spacing(2)} - ${theme.spacing(2)})`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        checkboxContainer: {
            padding: '10px 14px'
        }
    };
});

const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
};

const VideoSettingsContent = ({
    changeFlip,
    currentCameraDeviceId,
    disableLocalVideoFlip,
    localFlipX,
    selectBackground,
    setVideoInputDevice,
    toggleVideoSettings,
    videoDeviceIds,
    visibleVirtualBackground
}: IProps) => {
    const _componentWasUnmounted = useRef(false);
    const [ trackData, setTrackData ] = useState(new Array(videoDeviceIds.length).fill({
        jitsiTrack: null
    }));
    const { t } = useTranslation();
    const videoDevicesRef = useRef(videoDeviceIds);
    const trackDataRef = useRef(trackData);
    const { classes, cx } = useStyles();

    /**
     * Toggles local video flip state.
     *
     * @returns {void}
     */
    const _onToggleFlip = useCallback(() => {
        changeFlip(!localFlipX);
    }, [ localFlipX, changeFlip ]);

    /**
     * Destroys all the tracks from trackData object.
     *
     * @param {Object[]} tracks - An array of tracks that are to be disposed.
     * @returns {Promise<void>}
     */
    const _disposeTracks = (tracks: { jitsiTrack: any; }[]) => {
        tracks.forEach(({ jitsiTrack }) => {
            jitsiTrack?.dispose();
        });
    };

    /**
     * Creates and updates the track data.
     *
     * @returns {void}
     */
    const _setTracks = async () => {
        _disposeTracks(trackData);

        const newTrackData = await createLocalVideoTracks(videoDeviceIds, 5000);

        // In case the component gets unmounted before the tracks are created
        // avoid a leak by not setting the state
        if (_componentWasUnmounted.current) {
            _disposeTracks(newTrackData);
        } else {
            setTrackData(newTrackData);
            trackDataRef.current = newTrackData;
        }
    };

    /**
     * Returns the click handler used when selecting the video preview.
     *
     * @param {string} deviceId - The id of the camera device.
     * @returns {Function}
     */
    const _onEntryClick = (deviceId: string) => () => {
        setVideoInputDevice(deviceId);
        toggleVideoSettings();
    };

    /**
     * Renders a preview entry.
     *
     * @param {Object} data - The track data.
     * @param {number} index - The index of the entry.
     * @returns {React$Node}
     */
    // eslint-disable-next-line react/no-multi-comp
    const _renderPreviewEntry = (data: { deviceId: string; error?: string; jitsiTrack: any | null; },
            index: number) => {
        const { error, jitsiTrack, deviceId } = data;
        const isSelected = deviceId === currentCameraDeviceId;
        const key = `vp-${index}`;
        const tabIndex = '0';

        if (error) {
            return (
                <div
                    className = { classes.previewEntry }
                    key = { key }
                    tabIndex = { -1 } >
                    <div className = { classes.error }>{t(error)}</div>
                </div>
            );
        }

        const previewProps: any = {
            className: classes.previewEntry,
            key,
            tabIndex
        };
        const label = jitsiTrack?.getTrackLabel();

        if (isSelected) {
            previewProps['aria-checked'] = true;
            previewProps.className = cx(classes.previewEntry, classes.selectedEntry);
        } else {
            previewProps.onClick = _onEntryClick(deviceId);
            previewProps.onKeyPress = (e: React.KeyboardEvent) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    previewProps.onClick();
                }
            };
        }

        return (
            <div
                { ...previewProps }
                role = 'radio'>
                <div className = { classes.labelContainer }>
                    {label && <div className = { classes.label }>
                        <span>{label}</span>
                    </div>}
                </div>
                <Video
                    className = { cx(classes.previewVideo, 'flipVideoX') }
                    id = { `video_settings_preview-${index}` }
                    playsinline = { true }
                    videoTrack = {{ jitsiTrack }} />
            </div>
        );
    };

    useEffect(() => {
        _setTracks();

        return () => {
            _componentWasUnmounted.current = true;
            _disposeTracks(trackDataRef.current);
        };
    }, []);

    useEffect(() => {
        if (!equals(videoDeviceIds, videoDevicesRef.current)) {
            _setTracks();
            videoDevicesRef.current = videoDeviceIds;
        }
    }, [ videoDeviceIds ]);

    return (
        <ContextMenu
            activateFocusTrap = { true }
            aria-labelledby = 'video-settings-button'
            className = { classes.container }
            hidden = { false }
            id = 'video-settings-dialog'
            role = 'radiogroup'
            tabIndex = { -1 }>
            <ContextMenuItemGroup>
                {trackData.map((data, i) => _renderPreviewEntry(data, i))}
            </ContextMenuItemGroup>
            <ContextMenuItemGroup>
                { visibleVirtualBackground && <ContextMenuItem
                    accessibilityLabel = { t('virtualBackground.title') }
                    icon = { IconImage }
                    onClick = { selectBackground }
                    text = { t('virtualBackground.title') } /> }
                {!disableLocalVideoFlip && (
                    <div
                        className = { classes.checkboxContainer }
                        onClick = { stopPropagation }>
                        <Checkbox
                            checked = { localFlipX }
                            label = { t('videothumbnail.mirrorVideo') }
                            onChange = { _onToggleFlip } />
                    </div>
                )}
            </ContextMenuItemGroup>
        </ContextMenu>
    );
};

const mapStateToProps = (state: IReduxState) => {
    const { disableLocalVideoFlip } = state['features/base/config'];
    const { localFlipX } = state['features/base/settings'];

    return {
        disableLocalVideoFlip,
        localFlipX: Boolean(localFlipX),
        visibleVirtualBackground: checkBlurSupport()
        && checkVirtualBackgroundEnabled(state)
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

export default connect(mapStateToProps, mapDispatchToProps)(VideoSettingsContent);
