// @flow

import { openDialog } from '../../base/dialog';
import { IconCloseCircle } from '../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

import { KickRemoteParticipantDialog } from './';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant that this button is supposed to kick.
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
export default class AbstractKickButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.kick';
    icon = IconCloseCircle;
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
