import { Theme } from '@mui/material';
import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { translate } from '../../../base/i18n/functions';
import { IconRecord, IconSites } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import AbstractRecordingLabel, {
    IProps as AbstractProps,
    _mapStateToProps
} from '../AbstractRecordingLabel';

interface IProps extends AbstractProps {

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

}

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
class RecordingLabel extends AbstractRecordingLabel<IProps> {
    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    override _renderLabel() {
        const { _isTranscribing, _status, mode, t } = this.props;
        const classes = withStyles.getClasses(this.props);
        const isRecording = mode === JitsiRecordingConstants.mode.FILE;
        const icon = isRecording ? IconRecord : IconSites;
        let content;

        if (_status === JitsiRecordingConstants.status.ON) {
            content = t(isRecording ? 'videoStatus.recording' : 'videoStatus.streaming');

            if (_isTranscribing) {
                content += ` ${t('transcribing.labelTooltipExtra')}`;
            }
        } else if (mode === JitsiRecordingConstants.mode.STREAM) {
            return null;
        } else if (_isTranscribing) {
            content = t('transcribing.labelTooltip');
        } else {
            return null;
        }

        return (
            <Tooltip
                content = { content }
                position = { 'bottom' }>
                <Label
                    className = { classes.record }
                    icon = { icon } />
            </Tooltip>
        );
    }
}

export default withStyles(translate(connect(_mapStateToProps)(RecordingLabel)), styles);
