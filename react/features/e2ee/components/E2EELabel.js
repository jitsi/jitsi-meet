// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { IconE2EE } from '../../base/icons';
import { Label } from '../../base/label';
import { COLORS } from '../../base/label/constants';
import { connect } from '../../base/redux';
import { Tooltip } from '../../base/tooltip';

import { _mapStateToProps, type Props } from './AbstractE2EELabel';


/**
 * React {@code Component} for displaying a label when everyone has E2EE enabled in a conferene.
 *
 * @augments Component
 */
class E2EELabel extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._showLabel) {
            return null;
        }
        const { _e2eeLabels, t } = this.props;
        const content = _e2eeLabels?.labelToolTip || t('e2ee.labelToolTip');

        return (
            <Tooltip
                content = { content }
                position = { 'bottom' }>
                <Label
                    color = { COLORS.green }
                    icon = { IconE2EE } />
            </Tooltip>
        );
    }
}

export default translate(connect(_mapStateToProps)(E2EELabel));
