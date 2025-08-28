import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { IconModerator } from '../../../base/icons/svg';
import { PARTICIPANT_ROLE } from '../../../base/participants/constants';
import { getLocalParticipant, getParticipantById, isParticipantModerator } from '../../../base/participants/functions';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

import GrantModeratorDialog from './GrantModeratorDialog';

/**
 * Implements a React {@link Component} which displays a button for granting
 * moderator to a participant.
 *
 * @returns {JSX.Element|null}
 */
const GrantModeratorButton = ({
    notifyClick,
    notifyMode,
    participantID
}: IButtonProps): JSX.Element | null => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const localParticipant = useSelector(getLocalParticipant);
    const targetParticipant = useSelector((state: IReduxState) => getParticipantById(state, participantID));
    const visible = useMemo(() => Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR)
        && !isParticipantModerator(targetParticipant), [ isParticipantModerator, localParticipant, targetParticipant ]);

    const handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(openDialog(GrantModeratorDialog, { participantID }));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    if (!visible) {
        return null;
    }

    return (
        <ContextMenuItem
            accessibilityLabel = { t('toolbar.accessibilityLabel.grantModerator') }
            className = 'grantmoderatorlink'
            icon = { IconModerator }
            onClick = { handleClick }
            text = { t('videothumbnail.grantModerator') } />
    );
};

export default GrantModeratorButton;
