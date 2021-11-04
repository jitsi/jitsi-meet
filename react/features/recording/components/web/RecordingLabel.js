// @flow

import { withStyles } from '@material-ui/core/styles';
import React from 'react';

import { translate } from '../../../base/i18n';
import { Label } from '../../../base/label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux';
import AbstractRecordingLabel, {
    _mapStateToProps
} from '../AbstractRecordingLabel';

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        [JitsiRecordingConstants.mode.STREAM]: {
            background: theme.palette.ui03
        },
        [JitsiRecordingConstants.mode.FILE]: {
            background: theme.palette.iconError
        }
    };
};

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
        if (this.props._status !== JitsiRecordingConstants.status.ON) {
            // Since there are no expanded labels on web, we only render this
            // label when the recording status is ON.
            return null;
        }

        const { classes, mode, t } = this.props;

        return (
            <div>
                <Label
                    className = { classes && classes[mode] }
                    text = { t(this._getLabelKey()) } />
            </div>
        );
    }

    _getLabelKey: () => ?string;
}

export default withStyles(styles)(translate(connect(_mapStateToProps)(RecordingLabel)));
