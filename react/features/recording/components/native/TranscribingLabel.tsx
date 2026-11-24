import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconTranscription } from '../../../base/icons/svg';
import Label from '../../../base/label/components/native/Label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { StyleType } from '../../../base/styles/functions.any';
import { isRecorderTranscriptionsRunning } from '../../../transcribing/functions';
import AbstractRecordingLabel, {
    IProps as AbstractProps
} from '../AbstractRecordingLabel';

import styles from './styles';

/**
 * Implements a React {@link Component} which displays the current state of
 * transcription.
 *
 * @augments {Component}
 */
class TranscribingLabel extends AbstractRecordingLabel<AbstractProps> {

    /**
     * Renders the platform specific label component.
     *
     * @inheritdoc
     */
    _renderLabel() {
        const { _isTranscribing } = this.props;

        if (!_isTranscribing) {
            return null;
        }

        return (
            <Label
                icon = { IconTranscription }
                status = { 'on' }
                style = { styles.transcribingIndicatorStyle as StyleType } />
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
function _mapStateToProps(state: any) {
    const _isTranscribing = isRecorderTranscriptionsRunning(state);

    return {
        _isVisible: _isTranscribing,
        _iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        _isTranscribing,
        mode: 'transcribing', // Custom mode for transcription
        _status: _isTranscribing ? JitsiRecordingConstants.status.ON : JitsiRecordingConstants.status.OFF
    };
}

export default translate(connect(_mapStateToProps)(TranscribingLabel));
