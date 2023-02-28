import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';

import { translate } from '../../../base/i18n/functions';
import { IconRecord, IconSites } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux/functions';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';
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
        record: {
            background: theme.palette.actionDanger
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
        const isRecording = mode === JitsiRecordingConstants.mode.FILE;
        const icon = isRecording ? IconRecord : IconSites;
        const content = t(isRecording ? 'videoStatus.recording' : 'videoStatus.streaming');

        return (
            <Tooltip
                content = { content }
                position = { 'bottom' }>
                <Label
                    className = { classes?.record }
                    icon = { icon } />
            </Tooltip>
        );
    }
}

// @ts-ignore
export default withStyles(styles)(translate(connect(_mapStateToProps)(RecordingLabel)));
