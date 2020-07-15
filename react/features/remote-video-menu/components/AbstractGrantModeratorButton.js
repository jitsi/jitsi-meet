// @flow

import { openDialog } from '../../base/dialog';
import { IconCrown } from '../../base/icons';
import {
    getParticipantById,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../../base/participants';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';

import { GrantModeratorDialog } from '.';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant for whom to grant moderator status.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractGrantModeratorButton extends AbstractButton<Props, *> {
  accessibilityLabel = 'toolbar.accessibilityLabel.grantModerator';
  icon = IconCrown;
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
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { participantID } = ownProps;

    return {
        visible: isLocalParticipantModerator(state) && !isParticipantModerator(getParticipantById(state, participantID))
    };
}
