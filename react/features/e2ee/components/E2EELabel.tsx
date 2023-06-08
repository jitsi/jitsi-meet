import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconE2EE } from '../../base/icons/svg';
import Label from '../../base/label/components/web/Label';
import { COLORS } from '../../base/label/constants';
import Tooltip from '../../base/tooltip/components/Tooltip';

import { IProps, _mapStateToProps } from './AbstractE2EELabel';


const E2EELabel = ({ _e2eeLabels, _showLabel, t }: IProps) => {
    if (!_showLabel) {
        return null;
    }
    const content = _e2eeLabels?.tooltip || t('e2ee.labelToolTip');

    return (
        <Tooltip
            content = { content }
            position = { 'bottom' }>
            <Label
                color = { COLORS.green }
                icon = { IconE2EE } />
        </Tooltip>
    );
};

export default translate(connect(_mapStateToProps)(E2EELabel));
