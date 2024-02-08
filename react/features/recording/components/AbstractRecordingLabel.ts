import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';
import { isTranscribing } from '../../transcribing/functions';
import { getSessionStatusToShow, isRecordingRunning } from '../functions';


interface IProps extends WithTranslation {

    /**
     * Whether this is the Jibri recorder participant.
     */
    _iAmRecorder: boolean;

    /**
     * Whether the recording is currently running.
     */
    _isRecordingRunning: boolean;

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
 * State of the component.
 */
interface IState {

    /**
     * True if the label status is stale, so it needs to be removed.
     */
    staleLabel: boolean;
}

/**
 * Abstract class for the {@code RecordingLabel} component.
 */
export default class AbstractRecordingLabel extends Component<IProps, IState> {
    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return this.props._isRecordingRunning && !this.props._iAmRecorder
            ? this._renderLabel() : null;
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

    return {
        _isRecordingRunning: isRecordingRunning(state),
        _iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        _isTranscribing: isTranscribing(state),
        _status: getSessionStatusToShow(state, mode)
    };
}
