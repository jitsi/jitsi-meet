import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import { isTranscribing } from '../../transcribing/functions';
import { getActiveSession, getSessionStatusToShow, isRecordingRunning } from '../functions';


interface IProps extends WithTranslation {

    /**
     * Whether this is the Jibri recorder participant.
     */
    _iAmRecorder: boolean;

    /**
     * Whether the recording/livestreaming/transcriber is currently running.
     */
    _isRunning: boolean;

    /**
     * Whether this meeting is being transcribed.
     */
    _isTranscribing: boolean;

    /**
     * The status of the higher priority session.
     */
    _status?: string;

    /**
     * An object containing the CSS classes.
     */
    classes?: { [ key: string]: string; };

    /**
     * The recording mode this indicator should display.
     */
    mode: string;
}

/**
 * Abstract class for the {@code RecordingLabel} component.
 */
export default class AbstractRecordingLabel extends Component<IProps> {
    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { _iAmRecorder, _isRunning } = this.props;

        return _isRunning && !_iAmRecorder ? this._renderLabel() : null;
    }

    /**
     * Renders the platform specific label component.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderLabel(): React.ReactNode | null {
        return null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractRecordingLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _status: ?string
 * }}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { mode } = ownProps;
    const isLiveStreaming = mode === JitsiRecordingConstants.mode.STREAM;
    const isRunning = isLiveStreaming
        ? Boolean(getActiveSession(state, JitsiRecordingConstants.mode.STREAM)) : isRecordingRunning(state);

    return {
        _isRunning: isRunning,
        _iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        _isTranscribing: isTranscribing(state),
        _status: getSessionStatusToShow(state, mode)
    };
}
