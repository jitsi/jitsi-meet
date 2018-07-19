// @flow

import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { CircularLabel } from '../../base/label';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';

import AbstractRecordingLabel, {
    type Props,
    _mapStateToProps
} from './AbstractRecordingLabel';
import styles from './styles';

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

        return (
            <CircularLabel
                label = { this.props.t(this._getLabelKey()) }
                style = { indicatorStyle } />
        );
    }

    _getLabelKey: () => ?string
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
