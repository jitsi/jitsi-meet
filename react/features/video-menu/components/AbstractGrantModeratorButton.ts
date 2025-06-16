import { IReduxState } from '../../app/types';
import { openDialog } from '../../base/dialog/actions';
import { IconModerator } from '../../base/icons/svg';
import { PARTICIPANT_ROLE } from '../../base/participants/constants';
import { getLocalParticipant, getParticipantById, isParticipantModerator } from '../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

import { GrantModeratorDialog } from './';

export interface IProps extends AbstractButtonProps {

    /**
     * The ID of the participant for whom to grant moderator status.
     */
    participantID: string;
}

/**
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractGrantModeratorButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.grantModerator';
    icon = IconModerator;
    label = 'videothumbnail.grantModerator';

    /**
   * Handles clicking / pressing the button, and kicks the participant.
   *
   * @private
   * @returns {void}
   */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(GrantModeratorDialog, { participantID }));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *     visible: boolean
 * }}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantID } = ownProps;

    const localParticipant = getLocalParticipant(state);
    const targetParticipant = getParticipantById(state, participantID);

    return {
        visible: Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR)
            && !isParticipantModerator(targetParticipant)
    };
}
