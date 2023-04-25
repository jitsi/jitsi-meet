import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import Label from '../../../base/label/components/native/Label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { StyleType } from '../../../base/styles/functions.any';
import AbstractRecordingLabel, {
    _mapStateToProps
} from '../AbstractRecordingLabel';

import styles from './styles';

/**
 * Implements a React {@link Component} which displays the current state of
 * conference recording.
 *
 * @augments {Component}
 */
class RecordingLabel extends AbstractRecordingLabel {

    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    _renderLabel() {
        let status: 'on' | 'in_progress' | 'off' = 'on';

        switch (this.props._status) {
        case JitsiRecordingConstants.status.PENDING:
            status = 'in_progress';
            break;
        case JitsiRecordingConstants.status.OFF:
            status = 'off';
            break;
        }

        return (
            <Label
                status = { status }
                style = { styles.indicatorStyle as StyleType }
                text = { this.props.t(this._getLabelKey() ?? '') } />
        );
    }
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
