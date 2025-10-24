import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import { isRecorderTranscriptionsRunning } from '../../transcribing/functions';
import {
    getSessionStatusToShow,
    isLiveStreamingRunning,
    isRecordingRunning,
    isRemoteParticipantRecordingLocally
} from '../functions';

export interface IProps extends WithTranslation {

    /**
     * Whether this is the Jibri recorder participant.
     */
    _iAmRecorder: boolean;


    /**
     * Whether this meeting is being transcribed.
    */
    _isTranscribing: boolean;

    /**
    * Whether the recording/livestreaming/transcriber is currently running.
    */
    _isVisible: boolean;

    /**
     * The status of the higher priority session.
     */
    _status?: string;

    /**
     * The recording mode this indicator should display.
     */
    mode: string;
}

/**
 * Abstract class for the {@code RecordingLabel} component.
 */
export default class AbstractRecordingLabel<P extends IProps = IProps> extends Component<P> {
    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    override render() {
        const { _iAmRecorder, _isVisible } = this.props;

        return _isVisible && !_iAmRecorder ? this._renderLabel() : null;
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
    const isLiveStreamingLabel = mode === JitsiRecordingConstants.mode.STREAM;
    const _isTranscribing = isRecorderTranscriptionsRunning(state);
    const _isLivestreamingRunning = isLiveStreamingRunning(state);
    const _isVisible = isLiveStreamingLabel
        ? _isLivestreamingRunning // this is the livestreaming label
        : isRecordingRunning(state) || isRemoteParticipantRecordingLocally(state)
            || _isTranscribing; // this is the recording label

    return {
        _isVisible,
        _iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        _isTranscribing,
        _status: getSessionStatusToShow(state, mode)
    };
}
