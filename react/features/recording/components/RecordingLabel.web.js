// @flow

import React from 'react';
import { connect } from 'react-redux';

import { CircularLabel } from '../../base/label';
import { translate } from '../../base/i18n';

import AbstractRecordingLabel, {
    type Props,
    _mapStateToProps
} from './AbstractRecordingLabel';

/**
 * Implements a React {@link Component} which displays the current state of
 * conference recording.
 *
 * @extends {Component}
 */
class RecordingLabel extends AbstractRecordingLabel<Props> {
    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    _renderLabel() {
        return (
            <div>
                <CircularLabel
                    className = { this.props.mode }
                    label = { this.props.t(this._getLabelKey()) } />
            </div>
        );
    }

    _getLabelKey: () => ?string
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
