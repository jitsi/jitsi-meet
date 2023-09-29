import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import Label from '../../base/label/components/web/Label';
import Tooltip from '../../base/tooltip/components/Tooltip';

const TranscribingLabel = () => {
    const _showLabel = useSelector((state: IReduxState) => state['features/transcribing'].isTranscribing);
    const { t } = useTranslation();

    if (!_showLabel) {
        return null;
    }

    return (
        <Tooltip
            content = { t('transcribing.labelToolTip') }
            position = { 'left' }>
            <Label
                className = 'recording-label'
                text = { t('transcribing.tr') } />
        </Tooltip>
    );
};

export default TranscribingLabel;
