import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import Label from '../../base/label/components/web/Label';
import Tooltip from '../../base/tooltip/components/Tooltip';

import { IProps, _mapStateToProps } from './AbstractTranscribingLabel';

const TranscribingLabel = ({ _showLabel, t }: IProps) => {
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

export default translate(connect(_mapStateToProps)(TranscribingLabel));
