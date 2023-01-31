import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import Label from '../../base/label/components/web/Label';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { Tooltip } from '../../base/tooltip';

import { Props, _mapStateToProps } from './AbstractTranscribingLabel';

const TranscribingLabel = ({ _showLabel, t }: Props) => {
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
