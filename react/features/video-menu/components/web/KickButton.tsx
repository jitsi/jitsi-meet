import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { IconUserDeleted } from '../../../base/icons/svg';
import { getParticipantById, isRemoteParticipantHost } from '../../../base/participants/functions';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

import KickRemoteParticipantDialog from './KickRemoteParticipantDialog';

/**
 * Implements a React {@link Component} which displays a button for kicking out
 * a participant from the conference.
 *
 * @returns {JSX.Element | null}
 */
const KickButton = ({
    notifyClick,
    notifyMode,
    participantID
}: IButtonProps): JSX.Element | null => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(openDialog(KickRemoteParticipantDialog, { participantID }));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    const participant = useSelector((state: IReduxState) => getParticipantById(state, participantID));
    const isParticipantHost = isRemoteParticipantHost(participant);

    if (!participant || isParticipantHost) {
        return null;
    }

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.kick') }
            className = 'kicklink'
            icon = { IconUserDeleted }
            id = { `ejectlink_${participantID}` }
            onClick = { handleClick }
            text = { t('videothumbnail.kick') } />
    );
};

export default KickButton;
