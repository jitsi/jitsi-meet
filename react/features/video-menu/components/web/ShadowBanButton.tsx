import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { setChatShadowBan } from '../../../base/participants/actions';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

/**
 * Implements a React component which displays a button for
 * enabling chat shadow-ban for a participant.
 *
 * @returns {JSX.Element}
 */
const ShadowBanButton = ({
    notifyClick,
    notifyMode,
    participantID
}: IButtonProps): JSX.Element => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        notifyClick?.();

        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }

        dispatch(setChatShadowBan(participantID, true));
    }, [ dispatch, notifyClick, notifyMode, participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.shadowBan') }
            className = 'shadowbanlink'
            id = { `shadowbanlink_${participantID}` }
            onClick = { handleClick }
            text = { t('videothumbnail.shadowBan') } />
    );
};

export default ShadowBanButton;
