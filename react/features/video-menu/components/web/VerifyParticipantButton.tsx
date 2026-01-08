import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { IconCheck } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { startVerification } from '../../../e2ee/actions';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

/**
 * Implements a React {@link Component} which displays a button that
 * verifies the participant.
 *
 * @returns {JSX.Element}
 */
const VerifyParticipantButton = ({
    notifyClick,
    notifyMode,
    participantID
}: IButtonProps): JSX.Element => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const _handleClick = useCallback(() => {
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(startVerification(participantID));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.verify') }
            className = 'verifylink'
            icon = { IconCheck }
            id = { `verifylink_${participantID}` }
            // eslint-disable-next-line react/jsx-handler-names
            onClick = { _handleClick }
            text = { t('videothumbnail.verify') } />
    );
};

export default VerifyParticipantButton;
