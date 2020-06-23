// @flow

import Tooltip from '@atlaskit/tooltip';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { IconE2EE } from '../../base/icons';
import { CircularLabel } from '../../base/label';
import { connect } from '../../base/redux';

import { _mapStateToProps, type Props } from './AbstractE2EELabel';


/**
 * React {@code Component} for displaying a label when everyone has E2EE enabled in a conferene.
 *
 * @extends Component
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

        return (
            <Tooltip
                content = { this.props.t('e2ee.labelToolTip') }
                position = { 'left' }>
                <CircularLabel
                    className = 'e2ee'
                    icon = { IconE2EE } />
            </Tooltip>
        );
    }
}

export default translate(connect(_mapStateToProps)(E2EELabel));
