import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { openDialog } from '../../../base/dialog/actions';
import { IconMicSlash } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';
import { IButtonProps } from '../../types';

import MuteEveryoneDialog from './MuteEveryoneDialog';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID.
 *
 * @returns {JSX.Element}
 */
const MuteEveryoneElseButton = ({
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
        sendAnalytics(createToolbarEvent('mute.everyoneelse.pressed'));
        dispatch(openDialog(MuteEveryoneDialog, { exclude: [ participantID ] }));
    }, [ dispatch, notifyMode, notifyClick, participantID, sendAnalytics ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('toolbar.accessibilityLabel.muteEveryoneElse') }
            icon = { IconMicSlash }
            onClick = { handleClick }
            text = { t('videothumbnail.domuteOthers') } />
    );
};

export default MuteEveryoneElseButton;
