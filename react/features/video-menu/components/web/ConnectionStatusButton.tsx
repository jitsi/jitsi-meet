import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconInfoCircle } from '../../../base/icons/svg';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { renderConnectionStatus } from '../../actions.web';

interface IProps extends WithTranslation {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The ID of the participant for which to show connection stats.
     */
    participantId: string;
}


const ConnectionStatusButton = ({
    dispatch,
    t
}: IProps) => {
    const onClick = useCallback(e => {
        e.stopPropagation();
        dispatch(renderConnectionStatus(true));
    }, [ dispatch ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.connectionInfo') }
            icon = { IconInfoCircle }
            onClick = { onClick }
            text = { t('videothumbnail.connectionInfo') } />
    );
};

export default translate(connect()(ConnectionStatusButton));
