import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { approveParticipantAudio, approveParticipantVideo } from '../../../av-moderation/actions';
import { IconMic, IconVideo } from '../../../base/icons/svg';
import { MEDIA_TYPE, MediaType } from '../../../base/media/constants';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';

interface IProps {

    /**
     * The button key used to identify the click event.
     */
    buttonKey?: string;

    buttonType?: MediaType;

    /**
     * Callback to execute when the button is clicked.
     */
    notifyClick?: Function;

    /**
     * Notify mode for `participantMenuButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * The ID for the participant on which the button will act.
     */
    participantID: string;
}

const AskToUnmuteButton = ({
    buttonKey, buttonType = MEDIA_TYPE.AUDIO, notifyMode, notifyClick, participantID
}: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _onClick = useCallback(() => {
        notifyClick?.(buttonKey);
        if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            if (buttonType === MEDIA_TYPE.AUDIO) {
                dispatch(approveParticipantAudio(participantID));
            } else if (buttonType === MEDIA_TYPE.VIDEO) {
                dispatch(approveParticipantVideo(participantID));
            }
        }
    }, [
        approveParticipantAudio,
        approveParticipantVideo,
        buttonKey,
        buttonType,
        dispatch,
        notifyClick,
        notifyMode,
        participantID
    ]);

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
