import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconE2EE } from '../../base/icons/svg';
import Label from '../../base/label/components/web/Label';
import { COLORS } from '../../base/label/constants';
import Tooltip from '../../base/tooltip/components/Tooltip';

export interface IProps extends WithTranslation {

    /**
     * Custom e2ee labels.
     */
    _e2eeLabels?: any;

    /**
     * True if the label needs to be rendered, false otherwise.
     */
    _showLabel?: boolean;
}


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

/**
 * Maps (parts of) the redux state to the associated props of this {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    const { e2ee = {} } = state['features/base/config'];

    return {
        _e2eeLabels: e2ee.labels,
        _showLabel: state['features/base/participants'].numberOfParticipantsDisabledE2EE === 0
    };
}

export default translate(connect(_mapStateToProps)(E2EELabel));
