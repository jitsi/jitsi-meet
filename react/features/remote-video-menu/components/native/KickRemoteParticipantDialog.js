// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    createRemoteVideoMenuButtonEvent,
    sendAnalytics
} from '../../../analytics';
import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { kickParticipant } from '../../../base/participants';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The remote participant to be kicked.
     */
    participant: Object,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Dialog to confirm a remote participant kick action.
 */
class KickRemoteParticipantDialog extends Component<Props> {
    /**
     * Initializes a new {@code KickRemoteParticipantDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

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
            <ConfirmDialog
                contentKey = 'dialog.kickParticipantDialog'
                onSubmit = { this._onSubmit } />
        );
    }

    _onSubmit: () => boolean;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participant } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'kick.button',
            {
                'participant_id': participant.id
            }));

        dispatch(kickParticipant(participant.id));

        return true;
    }
}

export default translate(connect()(KickRemoteParticipantDialog));
