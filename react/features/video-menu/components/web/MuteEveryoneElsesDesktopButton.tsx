import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { openDialog } from '../../../base/dialog/actions';
import { IconScreenshare } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

import MuteEveryonesDesktopDialog from './MuteEveryonesDesktopDialog';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID.
 *
 * @returns {JSX.Element}
 */
const MuteEveryoneElsesDesktopButton = ({
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
        sendAnalytics(createToolbarEvent('mute.everyoneelsesdesktop.pressed'));
        dispatch(openDialog(MuteEveryonesDesktopDialog, { exclude: [ participantID ] }));
    }, [ notifyClick, notifyMode, participantID ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('toolbar.accessibilityLabel.muteEveryoneElsesDesktopStream') }
            icon = { IconScreenshare }
            onClick = { handleClick }
            text = { t('videothumbnail.domuteDesktopOfOthers') } />
    );
};

export default MuteEveryoneElsesDesktopButton;
