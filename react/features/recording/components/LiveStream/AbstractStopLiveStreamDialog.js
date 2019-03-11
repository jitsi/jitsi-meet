// @flow

import { Component } from 'react';

import {
    createLiveStreamingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';

import { getActiveSession } from '../../functions';

/**
 * The type of the React {@code Component} props of
 * {@link StopLiveStreamDialog}.
 */
type Props = {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * The redux representation of the live stremaing to be stopped.
     */
    _session: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A React Component for confirming the participant wishes to stop the currently
 * active live stream of the conference.
 *
 * @extends Component
 */
export default class AbstractStopLiveStreamDialog extends Component<Props> {
    /**
     * Initializes a new {@code StopLiveStreamDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Callback invoked when stopping of live streaming is confirmed.
     *
     * @private
     * @returns {boolean} True to close the modal.
     */
    _onSubmit() {
        sendAnalytics(createLiveStreamingDialogEvent('stop', 'confirm.button'));

        const { _session } = this.props;

        if (_session) {
            this.props._conference.stopRecording(_session.id);
        }

        return true;
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code StopLiveStreamDialog}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _session: Object
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _conference: state['features/base/conference'].conference,
        _session: getActiveSession(state, JitsiRecordingConstants.mode.STREAM)
    };
}
