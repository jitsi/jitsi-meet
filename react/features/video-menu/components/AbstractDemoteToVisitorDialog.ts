import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRemoteVideoMenuButtonEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IStore } from '../../app/types';
import { demoteRequest } from '../../visitors/actions';

interface IProps extends WithTranslation {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The ID of the remote participant to be demoted.
     */
    participantID: string;
}

/**
 * Abstract dialog to confirm a remote participant demote action.
 */
export default class AbstractDemoteToVisitorDialog
    extends Component<IProps> {
    /**
     * Initializes a new {@code AbstractDemoteToVisitorDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createRemoteVideoMenuButtonEvent(
            'demote.button',
            {
                'participant_id': participantID
            }));

        dispatch(demoteRequest(participantID));

        return true;
    }
}
