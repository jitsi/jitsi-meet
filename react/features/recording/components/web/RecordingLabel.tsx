import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconRecord, IconSites } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import AbstractRecordingLabel, { _mapStateToProps } from '../AbstractRecordingLabel';

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
        const { _isTranscribing, _status, classes, mode, t } = this.props;
        const isRecording = mode === JitsiRecordingConstants.mode.FILE;
        const icon = isRecording || _isTranscribing ? IconRecord : IconSites;
        let content;

        if (_status === JitsiRecordingConstants.status.ON) {
            content = t(isRecording || _isTranscribing ? 'videoStatus.recording' : 'videoStatus.streaming');

            if (_isTranscribing) {
                content += ` \u00B7 ${t('transcribing.labelToolTip')}`;
            }
        } else if (mode === JitsiRecordingConstants.mode.STREAM) {
            return null;
        } else if (_isTranscribing) {
            content = t('transcribing.labelToolTip');
        } else {
            return null;
        }

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

export default withStyles(styles)(translate(connect(_mapStateToProps)(RecordingLabel)));
