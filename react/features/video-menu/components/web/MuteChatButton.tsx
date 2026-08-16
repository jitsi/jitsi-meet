import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { IconMicSlash } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { muteChatParticipant, unmuteChatParticipant } from '../../../chat/actions.any';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';

interface IProps {
    isChatMuted: boolean;
    notifyClick?: () => void;
    notifyMode?: string;
    participantID: string;
}

const MuteChatButton = ({ isChatMuted, notifyClick, notifyMode, participantID }: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(isChatMuted ? unmuteChatParticipant(participantID) : muteChatParticipant(participantID));
    }, [ dispatch, isChatMuted, notifyClick, notifyMode, participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t(isChatMuted
                ? 'participantsPane.actions.unmuteChat'
                : 'participantsPane.actions.muteChat') }
            icon = { IconMicSlash }
            onClick = { handleClick }
            text = { t(isChatMuted
                ? 'participantsPane.actions.unmuteChat'
                : 'participantsPane.actions.muteChat') } />
    );
};

export default MuteChatButton;
