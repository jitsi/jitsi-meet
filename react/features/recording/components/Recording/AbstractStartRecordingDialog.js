// @flow

import React, { Component } from 'react';

import {
    createRecordingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import { Dialog } from '../../../base/dialog';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';

export type Props = {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Abstract class for {@code StartRecordingDialog} components.
 */
export default class AbstractStartRecordingDialog<P: Props>
    extends Component<P> {
    /**
     * Initializes a new {@code StartRecordingDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okTitleKey = 'dialog.confirm'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.recording'
                width = 'small'>
                { this._renderDialogContent() }
            </Dialog>
        );
    }

    _onSubmit: () => boolean;

    /**
     * Starts a file recording session.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        sendAnalytics(
            createRecordingDialogEvent('start', 'confirm.button')
        );

        this.props._conference.startRecording({
            mode: JitsiRecordingConstants.mode.FILE
        });

        return true;
    }

    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderDialogContent: () => React$Component<*>
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StartRecordingDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: JitsiConference
 * }}
 */
export function _mapStateToProps(state: Object) {
    return {
        _conference: state['features/base/conference'].conference
    };
}
