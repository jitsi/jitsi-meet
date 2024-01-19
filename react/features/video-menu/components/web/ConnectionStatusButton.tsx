import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { IconInfoCircle } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';
import { renderConnectionStatus } from '../../actions.web';
import { IButtonProps } from '../../types';

/**
 * Implements a React {@link Component} which displays a button that shows
 * the connection status for the given participant.
 *
 * @returns {JSX.Element}
 */
const ConnectionStatusButton = ({
    notifyClick,
    notifyMode
}: IButtonProps): JSX.Element => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const handleClick = useCallback(e => {
        e.stopPropagation();
        notifyClick?.();
        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }
        dispatch(renderConnectionStatus(true));
    }, [ dispatch, notifyClick, notifyMode ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.connectionInfo') }
            icon = { IconInfoCircle }
            onClick = { handleClick }
            text = { t('videothumbnail.connectionInfo') } />
    );
};

export default ConnectionStatusButton;
