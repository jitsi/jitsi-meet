// @flow
import React, { useCallback } from 'react';

import { translate } from '../../../base/i18n';
import { IconInfo } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { renderConnectionStatus } from '../../actions.web';

import VideoMenuButton from './VideoMenuButton';

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
    participantId,
    t
}: Props) => {
    const onClick = useCallback(() => {
        dispatch(renderConnectionStatus(true));
    }, [ dispatch ]);

    return (
        <VideoMenuButton
            buttonText = { t('videothumbnail.connectionInfo') }
            icon = { IconInfo }
            id = { `connstatus_${participantId}` }
            onClick = { onClick } />
    );
};

export default translate(connect()(ConnectionStatusButton));
