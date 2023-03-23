import { openDialog } from '../../base/dialog/actions';
import { IconUserDeleted } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

import { KickRemoteParticipantDialog } from './';

export interface IProps extends AbstractButtonProps {

    /**
     * The ID of the participant that this button is supposed to kick.
     */
    participantID: string;
}

/**
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractKickButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.kick';
    icon = IconUserDeleted;
    label = 'videothumbnail.kick';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(KickRemoteParticipantDialog, { participantID }));
    }
}
