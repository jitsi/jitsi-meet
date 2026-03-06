import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { ACTION_SHORTCUT_TRIGGERED, AUDIO_MUTE, createShortcutEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { AUDIO_MUTE_BUTTON_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { IconMic, IconMicSlash } from '../../../base/icons/svg';
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
import { isAudioMuteButtonDisabled } from '../../functions';

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
 * The type of the React {@code Component} props of {@link AudioMuteButton}.
 */
interface IProps extends Partial<AbstractButtonProps> {

    /**
     * External handler for click action.
     */
    handleClick?: Function;
}

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @returns {JSX.Element}
 */
const AudioMuteButton = (props: IProps) => {
    const { classes } = useStyles();
    const { t, i18n, ready: tReady } = useTranslation();
    const dispatch = useDispatch();

    const _audioMuted = useSelector((state: IReduxState) => isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO));
    const _disabled = useSelector((state: IReduxState) => isAudioMuteButtonDisabled(state));
    const _gumPending = useSelector((state: IReduxState) => state['features/base/media'].audio.gumPending);
    const visible = useSelector((state: IReduxState) => getFeatureFlag(state, AUDIO_MUTE_BUTTON_ENABLED, true));

    const isAudioMuted = _gumPending === IGUMPendingState.PENDING_UNMUTE ? false : _audioMuted;

    const onClick = useCallback(() => {
        if (props.handleClick) {
            props.handleClick();
        }

        dispatch(muteLocal(!isAudioMuted, MEDIA_TYPE.AUDIO));

        if (props.afterClick) {
            props.afterClick();
        }
    }, [ dispatch, isAudioMuted, props.handleClick, props.afterClick ]);

    const onKeyboardShortcut = useCallback(() => {
        // Ignore keyboard shortcuts if the audio button is disabled.
        if (_disabled) {
            return;
        }

        sendAnalytics(
            createShortcutEvent(
                AUDIO_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !isAudioMuted }));

        onClick();
    }, [ _disabled, isAudioMuted, onClick ]);

    useEffect(() => {
        dispatch(registerShortcut({
            character: 'M',
            helpDescription: 'keyboardShortcuts.mute',
            handler: onKeyboardShortcut
        }));

        return () => {
            dispatch(unregisterShortcut('M'));
        };
    }, [ dispatch, onKeyboardShortcut ]);

    const accessibilityLabel = _gumPending === IGUMPendingState.NONE
        ? (isAudioMuted ? 'toolbar.accessibilityLabel.unmute' : 'toolbar.accessibilityLabel.mute')
        : 'toolbar.accessibilityLabel.muteGUMPending';

    const label = _gumPending === IGUMPendingState.NONE
        ? (isAudioMuted ? 'toolbar.unmute' : 'toolbar.mute')
        : 'toolbar.muteGUMPending';

    const icon = isAudioMuted ? IconMicSlash : IconMic;
    const toggled = isAudioMuted;

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

export default AudioMuteButton;
