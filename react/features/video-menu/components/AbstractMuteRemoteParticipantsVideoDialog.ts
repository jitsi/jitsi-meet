import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState, IStore } from '../../app/types';
import { rejectParticipantVideo } from '../../av-moderation/actions';
import { isEnabledFromState } from '../../av-moderation/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { muteRemote } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteRemoteParticipantsVideoDialog}.
 */
export interface IProps extends WithTranslation {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not video moderation is on.
     */
    isVideoModerationOn: boolean;

    /**
     * The ID of the remote participant to be muted.
     */
    participantID: string;
}

/**
 * Abstract dialog to confirm a remote participant video ute action.
 *
 * @augments Component
 */
export default class AbstractMuteRemoteParticipantsVideoDialog<P extends IProps = IProps, State=any>
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
 * @param {IReduxState} state - The redux state.
 * @private
 * @returns {Object}
 */
export function abstractMapStateToProps(state: IReduxState) {
    return {
        isVideoModerationOn: isEnabledFromState(MEDIA_TYPE.VIDEO, state)
    };
}
