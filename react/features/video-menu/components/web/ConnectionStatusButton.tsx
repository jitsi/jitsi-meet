import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconInfoCircle } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/constants';
import { renderConnectionStatus } from '../../actions.web';

interface IProps extends WithTranslation {

    /**
     * The button key used to identify the click event.
     */
    buttonKey: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

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
     * The ID of the participant for which to show connection stats.
     */
    participantID: string;
}


const ConnectionStatusButton = ({
    buttonKey,
    dispatch,
    notifyClick,
    notifyMode,
    participantID,
    t
}: IProps) => {
    const onClick = useCallback(e => {
        e.stopPropagation();
        notifyClick?.(buttonKey, participantID);
        if (notifyMode !== NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            dispatch(renderConnectionStatus(true));
        }
    }, [ buttonKey, dispatch, notifyClick, notifyMode, participantID, renderConnectionStatus ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.connectionInfo') }
            icon = { IconInfoCircle }
            onClick = { onClick }
            text = { t('videothumbnail.connectionInfo') } />
    );
};

export default translate(connect()(ConnectionStatusButton));
