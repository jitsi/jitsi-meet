// @flow

import { Component } from 'react';

import { rejectParticipantVideo } from '../../av-moderation/actions';
import { isEnabledFromState } from '../../av-moderation/functions';
import { MEDIA_TYPE } from '../../base/media';
import { muteRemote } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteRemoteParticipantsVideoDialog}.
 */
export type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Whether or not video moderation is on.
     */
    isVideoModerationOn: boolean,

    /**
     * The ID of the remote participant to be muted.
     */
    participantID: string,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to confirm a remote participant video ute action.
 *
 * @extends Component
 */
export default class AbstractMuteRemoteParticipantsVideoDialog<P:Props = Props, State=void>
    extends Component<P, State> {
    /**
     * Initializes a new {@code AbstractMuteRemoteParticipantsVideoDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Handles the submit button action.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const { dispatch, participantID } = this.props;

        dispatch(muteRemote(participantID, MEDIA_TYPE.VIDEO));
        dispatch(rejectParticipantVideo(participantID));

        return true;
    }
}

/**
 * Maps (parts of) the redux state to the associated
 * {@code AbstractDialogContainer}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Object}
 */
export function abstractMapStateToProps(state: Object) {
    return {
        isVideoModerationOn: isEnabledFromState(MEDIA_TYPE.VIDEO, state)
    };
}
