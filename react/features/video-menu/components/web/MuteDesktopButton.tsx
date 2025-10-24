import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createRemoteVideoMenuButtonEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { IconScreenshare } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { isRemoteTrackMuted } from '../../../base/tracks/functions.any';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

import MuteRemoteParticipantsDesktopDialog from './MuteRemoteParticipantsDesktopDialog';

/**
 * Implements a React {@link Component} which displays a button for disabling
 * the desktop share of a participant in the conference.
 *
 * @returns {JSX.Element|null}
 */
const MuteDesktopButton = ({
    notifyClick,
    notifyMode,
    participantID
}: IButtonProps): JSX.Element | null => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const tracks = useSelector((state: IReduxState) => state['features/base/tracks']);

    // TODO: review if we shouldn't be using isParticipantMediaMuted.
    const trackMuted = useMemo(
        () => isRemoteTrackMuted(tracks, MEDIA_TYPE.SCREENSHARE, participantID),
        [ isRemoteTrackMuted, participantID, tracks ]
    );

    const handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'desktop.mute.button',
            {
                'participant_id': participantID
            }));

        dispatch(openDialog(MuteRemoteParticipantsDesktopDialog, { participantID }));
    }, [ dispatch, notifyClick, notifyClick, participantID, sendAnalytics ]);

    if (trackMuted) {
        return null;
    }

    return (
        <ContextMenuItem
            accessibilityLabel = { t('participantsPane.actions.stopDesktop') }
            className = 'mutedesktoplink'
            icon = { IconScreenshare }
            onClick = { handleClick }
            text = { t('participantsPane.actions.stopDesktop') } />
    );
};

export default MuteDesktopButton;
