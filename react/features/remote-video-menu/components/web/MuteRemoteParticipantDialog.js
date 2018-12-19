/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

import {
    createRemoteMuteConfirmedEvent,
    sendAnalytics
} from '../../../analytics';
import { muteRemoteParticipant } from '../../../base/participants';

/**
 * The type of the React {@code Component} props of
 * {@link MuteRemoteParticipantDialog}.
 */
type Props = {

    /**
     * Invoked to send a request for muting the participant with the passed
     * in participantID.
     */
    dispatch: Dispatch<*>,

    /**
     * The ID of the participant linked to the onClick callback.
     */
    participantID: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before muting a remote participant.
 *
 * @extends Component
 */
class MuteRemoteParticipantDialog extends Component<Props> {
    /**
     * Initializes a new {@code MuteRemoteParticipantDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._renderContent = this._renderContent.bind(this);
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
                okTitleKey = 'dialog.muteParticipantButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.muteParticipantTitle'
                width = 'small'>
                { this._renderContent() }
            </Dialog>
        );
    }

    _onSubmit: () => void;

    /**
     * Handles the submit button action.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createRemoteMuteConfirmedEvent(participantID));

        dispatch(muteRemoteParticipant(participantID));

        return true;
    }

    _renderContent: () => React$Element<*>;

    /**
     * Renders the content of the dialog.
     *
     * @private
     * @returns {Component} The React {@code Component} which is the view of the
     * dialog content.
     */
    _renderContent() {
        const { t } = this.props;

        return (
            <div>
                { t('dialog.muteParticipantBody') }
            </div>
        );
    }

}

export default translate(connect()(MuteRemoteParticipantDialog));
