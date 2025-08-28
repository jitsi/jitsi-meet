import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createRemoteVideoMenuButtonEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { rejectParticipantAudio } from '../../../av-moderation/actions';
import { IconMicSlash } from '../../../base/icons/svg';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { isRemoteTrackMuted } from '../../../base/tracks/functions.any';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { muteRemote } from '../../actions.any';
import { IButtonProps } from '../../types';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * a participant in the conference.
 *
 * @returns {JSX.Element|null}
 */
const MuteButton = ({
    notifyClick,
    notifyMode,
    participantID
}: IButtonProps): JSX.Element | null => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const tracks = useSelector((state: IReduxState) => state['features/base/tracks']);
    const audioTrackMuted = useMemo(
        () => isRemoteTrackMuted(tracks, MEDIA_TYPE.AUDIO, participantID),
        [ isRemoteTrackMuted, participantID, tracks ]
    );

    const handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'mute',
            {
                'participant_id': participantID
            }));

        dispatch(muteRemote(participantID, MEDIA_TYPE.AUDIO));
        dispatch(rejectParticipantAudio(participantID));
    }, [ dispatch, notifyClick, notifyMode, participantID, sendAnalytics ]);

    if (audioTrackMuted) {
        return null;
    }

    return (
        <ContextMenuItem
            accessibilityLabel = { t('dialog.muteParticipantButton') }
            className = 'mutelink'
            icon = { IconMicSlash }
            onClick = { handleClick }
            text = { t('dialog.muteParticipantButton') } />
    );
};

export default MuteButton;
