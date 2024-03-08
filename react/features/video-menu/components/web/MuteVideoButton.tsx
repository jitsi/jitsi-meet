import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createRemoteVideoMenuButtonEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { IconVideoOff } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { isRemoteTrackMuted } from '../../../base/tracks/functions.any';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

import MuteRemoteParticipantsVideoDialog from './MuteRemoteParticipantsVideoDialog';

/**
 * Implements a React {@link Component} which displays a button for disabling
 * the camera of a participant in the conference.
 *
 * @returns {JSX.Element|null}
 */
const MuteVideoButton = ({
    notifyClick,
    notifyMode,
    participantID
}: IButtonProps): JSX.Element | null => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const tracks = useSelector((state: IReduxState) => state['features/base/tracks']);

    const videoTrackMuted = useMemo(
        () => isRemoteTrackMuted(tracks, MEDIA_TYPE.VIDEO, participantID),
        [ isRemoteTrackMuted, participantID, tracks ]
    );

    const handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'video.mute.button',
            {
                'participant_id': participantID
            }));

        dispatch(openDialog(MuteRemoteParticipantsVideoDialog, { participantID }));
    }, [ dispatch, notifyClick, notifyClick, participantID, sendAnalytics ]);

    if (videoTrackMuted) {
        return null;
    }

    return (
        <ContextMenuItem
            accessibilityLabel = { t('participantsPane.actions.stopVideo') }
            className = 'mutevideolink'
            icon = { IconVideoOff }
            onClick = { handleClick }
            text = { t('participantsPane.actions.stopVideo') } />
    );
};

export default MuteVideoButton;
