import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';

import { translate } from '../../../base/i18n/functions';
import Label from '../../../base/label/components/web/Label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux/functions';
import AbstractRecordingLabel, {
    _mapStateToProps

    // @ts-ignore
} from '../AbstractRecordingLabel';

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (theme: Theme) => {
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
        // @ts-ignore
        if (this.props._status !== JitsiRecordingConstants.status.ON) {
            // Since there are no expanded labels on web, we only render this
            // label when the recording status is ON.
            return null;
        }

        // @ts-ignore
        const { classes, mode, t } = this.props;

        return (
            <div>
                <Label
                    className = { classes?.[mode] }

                    // @ts-ignore
                    text = { t(this._getLabelKey()) } />
            </div>
        );
    }
}

// @ts-ignore
export default withStyles(styles)(translate(connect(_mapStateToProps)(RecordingLabel)));
