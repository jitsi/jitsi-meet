import { Theme } from '@mui/material';
import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconTranscription } from '../../../base/icons/svg';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { isRecorderTranscriptionsRunning } from '../../../transcribing/functions';
import AbstractRecordingLabel, {
    IProps as AbstractProps
} from '../AbstractRecordingLabel';
import StopRecordingDialog from '../Recording/web/StopRecordingDialog';

interface IProps extends AbstractProps {

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
 * @param {Object} _theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (_theme: Theme) => {
    return {
        transcribing: {
            background: '#4CAF50' // Green background for transcription
        }
    };
};

/**
 * Implements a React {@link Component} which displays the current state of
 * transcription.
 *
 * @augments {Component}
 */
class TranscribingLabel extends AbstractRecordingLabel<IProps> {
    /**
     * Initializes a new {@code TranscribingLabel} instance.
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
        this.props.dispatch(openDialog('StopRecordingDialog', StopRecordingDialog));
    }

    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    override _renderLabel() {
        const { _isTranscribing, t } = this.props;
        const classes = withStyles.getClasses(this.props);

        if (!_isTranscribing) {
            return null;
        }

        const content = t('transcribing.labelTooltip');

        return (
            <Tooltip
                content = { content }
                position = { 'bottom' }>
                <Label
                    className = { classes.transcribing }
                    icon = { IconTranscription }
                    onClick = { this._onClick } />
            </Tooltip>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    const _isTranscribing = isRecorderTranscriptionsRunning(state);

    return {
        _isVisible: _isTranscribing,
        _iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        _isTranscribing,
        mode: 'transcribing' // Custom mode for transcription
    };
}

export default withStyles(translate(connect(_mapStateToProps)(TranscribingLabel)), styles);
