// @flow

import { openDialog } from '../../base/dialog';
import { IconTip } from '../../base/icons';
import { AbstractButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';

import TipRemoteParticipantDialog from './web/TipRemoteParticipantDialog';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant that this button is supposed to tip.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which tips the remote participant.
 */
export default class AbstractTipButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.tip';
    icon = IconTip;
    label = 'videothumbnail.tip';

    /**
     * Handles clicking / pressing the button, and opens the tipping dialog for a participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(TipRemoteParticipantDialog, { participantID }));
    }
}
