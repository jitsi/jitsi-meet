// @flow

import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import KickRemoteParticipantDialog from './KickRemoteParticipantDialog';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The participant object that this button is supposed to kick.
     */
    participant: Object
};

/**
 * A remote video menu button which kicks the remote participant.
 */
class KickButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.audioRoute';
    iconName = 'icon-kick';
    label = 'videothumbnail.kick';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participant } = this.props;

        dispatch(openDialog(KickRemoteParticipantDialog, { participant }));
    }
}

export default translate(connect()(KickButton));
