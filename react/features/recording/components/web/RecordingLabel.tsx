import { Theme } from '@mui/material';
import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconRecord, IconSites } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { hasRecordingOrTranscriptionFeature } from '../../functions';
import AbstractRecordingLabel, {
    IProps as AbstractProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractRecordingLabel';
import StopRecordingDialog from '../Recording/web/StopRecordingDialog';

interface IProps extends AbstractProps {

    /**
     * Whether the local participant can control recording/transcription (has either feature enabled).
     */
    _canControlRecording: boolean;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

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
     * Initializes a new {@code RecordingLabel} instance.
     *
     * @param {IProps} props - The props of the component.
     */
    constructor(props: IProps) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Handles clicking on the label.
     *
     * @returns {void}
     */
    _onClick() {
        if (this.props._canControlRecording) {
            this.props.dispatch(openDialog('StopRecordingDialog', StopRecordingDialog));
        }
    }

    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    override _renderLabel() {
        const { _status, mode, t } = this.props;
        const classes = withStyles.getClasses(this.props);
        const isRecording = mode === JitsiRecordingConstants.mode.FILE;
        const icon = isRecording ? IconRecord : IconSites;
        let content;

        if (_status === JitsiRecordingConstants.status.ON) {
            content = t(isRecording ? 'videoStatus.recording' : 'videoStatus.streaming');
        } else if (mode === JitsiRecordingConstants.mode.STREAM) {
            return null;
        } else {
            return null;
        }

        return (
            <Tooltip
                content = { content }
                position = { 'bottom' }>
                <Label
                    className = { classes.record }
                    icon = { icon }
                    onClick = { this._onClick } />
            </Tooltip>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The component's own props.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    return {
        ..._abstractMapStateToProps(state, ownProps),
        _canControlRecording: hasRecordingOrTranscriptionFeature(state)
    };
}

export default withStyles(translate(connect(_mapStateToProps)(RecordingLabel)), styles);
