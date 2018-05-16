// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    createRecordingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

/**
 * The type of the React {@code Component} props of {@link StopRecordingDialog}.
 */
type Props = {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * The redux representation of the recording session to be stopped.
     */
    session: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React Component for getting confirmation to stop a file recording session in
 * progress.
 *
 * @extends Component
 */
class StopRecordingDialog extends Component<Props> {
    /**
     * Initializes a new {@code StopRecordingDialog} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
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
                okTitleKey = 'dialog.stopRecording'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.recording'
                width = 'small'>
                { this.props.t('dialog.stopRecordingWarning') }
            </Dialog>
        );
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

        const { session } = this.props;

        if (session) {
            this.props._conference.stopRecording(session.id);
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
 *     _conference: JitsiConference
 * }}
 */
function _mapStateToProps(state) {
    return {
        _conference: state['features/base/conference'].conference
    };
}

export default translate(connect(_mapStateToProps)(StopRecordingDialog));
