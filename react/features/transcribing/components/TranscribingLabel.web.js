// @flow

import Tooltip from '@atlaskit/tooltip';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { CircularLabel } from '../../base/label';
import { connect } from '../../base/redux';

import { _mapStateToProps, type Props } from './AbstractTranscribingLabel';

/**
 * React {@code Component} for displaying a label when a transcriber is in the
 * conference.
 *
 * @extends Component
 */
class TranscribingLabel extends Component<Props> {

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
                content = { this.props.t('transcribing.labelToolTip') }
                position = { 'left' }>
                <CircularLabel
                    className = 'recording-label'
                    label = { this.props.t('transcribing.tr') } />
            </Tooltip>
        );
    }

}

export default translate(connect(_mapStateToProps)(TranscribingLabel));
