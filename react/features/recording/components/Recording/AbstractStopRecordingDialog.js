// @flow

import { Component } from 'react';

import {
    createRecordingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { getActiveSession } from '../../functions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractStopRecordingDialog}.
 */
export type Props = {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * The redux representation of the recording session to be stopped.
     */
    _fileRecordingSession: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Abstract React Component for getting confirmation to stop a file recording
 * session in progress.
 *
 * @augments Component
 */
export default class AbstractStopRecordingDialog<P: Props>
    extends Component<P> {
    /**
     * Initializes a new {@code AbstrStopRecordingDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Stops the recording session.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        sendAnalytics(createRecordingDialogEvent('stop', 'confirm.button'));

        const { _fileRecordingSession } = this.props;

        if (_fileRecordingSession) {
            this.props._conference.stopRecording(_fileRecordingSession.id);
        }

        return true;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StopRecordingDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: JitsiConference,
 *     _fileRecordingSession: Object
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _conference: state['features/base/conference'].conference,
        _fileRecordingSession:
            getActiveSession(state, JitsiRecordingConstants.mode.FILE)
    };
}
