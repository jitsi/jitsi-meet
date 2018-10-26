// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { CircularLabel } from '../../base/label';

import { _mapStateToProps, type Props } from './AbstractTranscribingLabel';

/**
 * React {@code Component} for displaying a label when a transcriber is in the
 * conference.
 *
 * @extends Component
 */
class TranscribingLabel extends Component<Props> {

    /**
     * Renders the platform-specific label component.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._showLabel) {
            return null;
        }

        return (
            <CircularLabel
                label = { this.props.t('transcribing.tr') } />
        );
    }
}

export default translate(connect(_mapStateToProps)(TranscribingLabel));
