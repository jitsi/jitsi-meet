import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState, IStore } from '../../app/types';
import { rejectParticipantDesktop } from '../../av-moderation/actions';
import { MEDIA_TYPE as AVM_MEDIA_TYPE } from '../../av-moderation/constants';
import { isEnabledFromState } from '../../av-moderation/functions';
import { MEDIA_TYPE } from '../../base/media/constants';
import { muteRemote } from '../actions';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractMuteRemoteParticipantsDesktopDialog}.
 */
export interface IProps extends WithTranslation {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Whether or not desktop moderation is on.
     */
    isModerationOn: boolean;

    /**
     * The ID of the remote participant to be muted.
     */
    participantID: string;
}

/**
 * Abstract dialog to confirm a remote participant desktop mute action.
 *
 * @augments Component
 */
export default class AbstractMuteRemoteParticipantsDesktopDialog<P extends IProps = IProps, State=any>
    extends Component<P, State> {
    /**
     * Initializes a new {@code AbstractMuteRemoteParticipantsDesktopDialog} instance.
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

        dispatch(muteRemote(participantID, MEDIA_TYPE.SCREENSHARE));
        dispatch(rejectParticipantDesktop(participantID));

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
        isModerationOn: isEnabledFromState(AVM_MEDIA_TYPE.DESKTOP, state)
    };
}
