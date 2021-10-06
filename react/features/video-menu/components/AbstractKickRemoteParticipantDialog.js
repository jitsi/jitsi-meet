// @flow

import { Component } from 'react';

import {
    createRemoteVideoMenuButtonEvent,
    sendAnalytics
} from '../../analytics';
import { kickParticipant } from '../../base/participants';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * The ID of the remote participant to be kicked.
     */
    participantID: string,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to confirm a remote participant kick action.
 */
export default class AbstractKickRemoteParticipantDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractKickRemoteParticipantDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'kick.button',
            {
                'participant_id': participantID
            }));

        dispatch(kickParticipant(participantID));

        return true;
    }
}
