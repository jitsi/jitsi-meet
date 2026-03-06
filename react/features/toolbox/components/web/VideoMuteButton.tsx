import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { ACTION_SHORTCUT_TRIGGERED, VIDEO_MUTE, createShortcutEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { VIDEO_MUTE_BUTTON_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { IconVideo, IconVideoOff } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { IGUMPendingState } from '../../../base/media/types';
import { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import ToolboxItem from '../../../base/toolbox/components/ToolboxItem.web';
import { isLocalTrackMuted } from '../../../base/tracks/functions';
import Spinner from '../../../base/ui/components/web/Spinner';
import { TOOLTIP_POSITION } from '../../../base/ui/constants.any';
import { registerShortcut, unregisterShortcut } from '../../../keyboard-shortcuts/actions';
import { muteLocal } from '../../../video-menu/actions';
import { SPINNER_COLOR } from '../../constants';
import { isVideoMuteButtonDisabled } from '../../functions';

const useStyles = makeStyles()(() => {
    return {
        pendingContainer: {
            position: 'absolute' as const,
            bottom: '3px',
            right: '3px'
        }
    };
});

/**
 * The type of the React {@code Component} props of {@link VideoMuteButton}.
 */
interface IProps extends Partial<AbstractButtonProps> {

    /**
     * External handler for click action.
     */
    handleClick?: Function;
}

/**
 * Component that renders a toolbar button for toggling video mute.
 *
 * @returns {JSX.Element}
 */
const VideoMuteButton = (props: IProps) => {
    const { classes } = useStyles();
    const { t, i18n, ready: tReady } = useTranslation();
    const dispatch = useDispatch();

    const _videoMuted = useSelector((state: IReduxState) => isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO));
    const _disabled = useSelector((state: IReduxState) => isVideoMuteButtonDisabled(state));
    const _gumPending = useSelector((state: IReduxState) => state['features/base/media'].video.gumPending);
    const visible = useSelector((state: IReduxState) => getFeatureFlag(state, VIDEO_MUTE_BUTTON_ENABLED, true));

    const isVideoMuted = _gumPending === IGUMPendingState.PENDING_UNMUTE ? false : _videoMuted;

    const onClick = useCallback(() => {
        if (props.handleClick) {
            props.handleClick();
        }

        dispatch(muteLocal(!isVideoMuted, MEDIA_TYPE.VIDEO));

        if (props.afterClick) {
            props.afterClick();
        }
    }, [ dispatch, isVideoMuted, props.handleClick, props.afterClick ]);

    const onKeyboardShortcut = useCallback(() => {
        // Ignore keyboard shortcuts if the video button is disabled.
        if (_disabled) {
            return;
        }

        sendAnalytics(
            createShortcutEvent(
                VIDEO_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !isVideoMuted }));

        onClick();
    }, [ _disabled, isVideoMuted, onClick ]);

    useEffect(() => {
        dispatch(registerShortcut({
            character: 'V',
            helpDescription: 'keyboardShortcuts.videoMute',
            handler: onKeyboardShortcut
        }));

        return () => {
            dispatch(unregisterShortcut('V'));
        };
    }, [ dispatch, onKeyboardShortcut ]);

    const accessibilityLabel = _gumPending === IGUMPendingState.NONE
        ? (isVideoMuted ? 'toolbar.accessibilityLabel.unmuteVideo' : 'toolbar.accessibilityLabel.muteVideo')
        : 'toolbar.accessibilityLabel.videomuteGUMPending';

    const label = _gumPending === IGUMPendingState.NONE
        ? (isVideoMuted ? 'toolbar.unmuteVideo' : 'toolbar.muteVideo')
        : 'toolbar.videomuteGUMPending';

    const icon = isVideoMuted ? IconVideoOff : IconVideo;
    const toggled = isVideoMuted;

    const onKeyDown = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === ' ' || e?.key === 'Enter') {
            onClick();
        }
    }, [ onClick ]);

    if (!visible) {
        return null;
    }

    const elementAfter = _gumPending === IGUMPendingState.NONE ? null
        : (
            <div className = { classes.pendingContainer }>
                <Spinner
                    color = { SPINNER_COLOR }
                    size = 'small' />
            </div>
        );

    return (
        <ToolboxItem
            accessibilityLabel = { t(accessibilityLabel) }
            disabled = { _disabled }
            elementAfter = { elementAfter }
            icon = { icon }
            label = { t(label) }
            labelProps = { {} }
            onClick = { onClick }
            onKeyDown = { onKeyDown }
            showLabel = { props.showLabel ?? false }
            toggled = { toggled }
            tooltip = { t(label) }
            tooltipPosition = { props.tooltipPosition as TOOLTIP_POSITION ?? 'top' }
            visible = { true }
            { ...props as any }
            dispatch = { dispatch }
            i18n = { i18n }
            t = { t }
            tReady = { tReady } />
    );
};

export default VideoMuteButton;
