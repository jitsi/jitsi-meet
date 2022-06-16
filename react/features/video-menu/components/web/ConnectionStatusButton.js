// @flow
import React, { useCallback } from 'react';

import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { translate } from '../../../base/i18n';
import { IconInfo } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { renderConnectionStatus } from '../../actions.web';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the participant for which to show connection stats.
     */
    participantId: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};


const ConnectionStatusButton = ({
    dispatch,
    t
}: Props) => {
    const onClick = useCallback(e => {
        e.stopPropagation();
        dispatch(renderConnectionStatus(true));
    }, [ dispatch ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { t('videothumbnail.connectionInfo') }
            icon = { IconInfo }
            onClick = { onClick }
            text = { t('videothumbnail.connectionInfo') } />
    );
};

export default translate(connect()(ConnectionStatusButton));
