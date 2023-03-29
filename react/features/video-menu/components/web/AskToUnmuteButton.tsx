import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipantAudio, approveParticipantVideo } from '../../../av-moderation/actions';
import { IconMic, IconVideo } from '../../../base/icons/svg';
import { MEDIA_TYPE, MediaType } from '../../../base/media/constants';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';

interface IProps {

    buttonType: MediaType;

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string;
}

const AskToUnmuteButton = ({ buttonType, participantID }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        if (buttonType === MEDIA_TYPE.AUDIO) {
            dispatch(approveParticipantAudio(participantID));
        } else if (buttonType === MEDIA_TYPE.VIDEO) {
            dispatch(approveParticipantVideo(participantID));
        }
    }, [ participantID, buttonType ]);

    const text = useMemo(() => {
        if (buttonType === MEDIA_TYPE.AUDIO) {
            return t('participantsPane.actions.askUnmute');
        } else if (buttonType === MEDIA_TYPE.VIDEO) {
            return t('participantsPane.actions.allowVideo');
        }

        return '';
    }, [ buttonType ]);

    const icon = useMemo(() => {
        if (buttonType === MEDIA_TYPE.AUDIO) {
            return IconMic;
        } else if (buttonType === MEDIA_TYPE.VIDEO) {
            return IconVideo;
        }
    }, [ buttonType ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            icon = { icon }
            onClick = { _onClick }
            testId = { `unmute-${buttonType}-${participantID}` }
            text = { text } />
    );
};

export default AskToUnmuteButton;
