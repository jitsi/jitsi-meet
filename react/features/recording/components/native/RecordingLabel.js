// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { CircularLabel } from '../../../base/label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux';

import AbstractRecordingLabel, {
    _mapStateToProps
} from '../AbstractRecordingLabel';

import styles from './styles';

/**
 * Implements a React {@link Component} which displays the current state of
 * conference recording.
 *
 * @extends {Component}
 */
class RecordingLabel extends AbstractRecordingLabel {

    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    _renderLabel() {
        let indicatorStyle;

        switch (this.props.mode) {
        case JitsiRecordingConstants.mode.STREAM:
            indicatorStyle = styles.indicatorLive;
            break;
        case JitsiRecordingConstants.mode.FILE:
            indicatorStyle = styles.indicatorRecording;
            break;
        default:
            // Invalid mode is passed to the component.
            return null;
        }

        let status = 'on';

        switch (this.props._status) {
        case JitsiRecordingConstants.status.PENDING:
            status = 'in_progress';
            break;
        case JitsiRecordingConstants.status.OFF:
            status = 'off';
            break;
        }

        return (
            <CircularLabel
                label = { this.props.t(this._getLabelKey()) }
                status = { status }
                style = { indicatorStyle } />
        );
    }

    _getLabelKey: () => ?string
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
