// @flow

import { approveParticipant } from '../../../av-moderation/actions';
import { translate } from '../../../base/i18n';
import { IconMicrophone } from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { getParticipantById, isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { isForceMuted } from '../../../participants-pane/functions';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant object that this button is supposed to
     * ask to unmute.
     */
    participantID: string,
};

/**
 * An abstract remote video menu button which asks the remote participant to unmute.
 */
class AskUnmuteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'participantsPane.actions.askUnmute';
    icon = IconMicrophone;
    label = 'participantsPane.actions.askUnmute';

    /**
     * Handles clicking / pressing the button, and asks the participant to unmute.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(approveParticipant(participantID));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - Properties of component.
 * @returns {Props}
 */
function mapStateToProps(state, ownProps) {
    const { participantID } = ownProps;
    const participant = getParticipantById(state, participantID);

    return {
        visible: isLocalParticipantModerator(state)
            && (isForceMuted(participant, MEDIA_TYPE.AUDIO, state)
            || isForceMuted(participant, MEDIA_TYPE.VIDEO, state))
    };
}

export default translate(connect(mapStateToProps)(AskUnmuteButton));
