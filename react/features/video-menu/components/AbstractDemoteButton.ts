import { openDialog } from '../../base/dialog/actions';
import { IconUsers } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

import { DemoteToVisitorDialog } from './';

export interface IProps extends AbstractButtonProps {

    /**
     * The ID of the participant that this button is supposed to kick.
     */
    participantID: string;
}

/**
 * An abstract remote video menu button which demotes the remote participant.
 */
export default class AbstractDemoteButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.demote';
    icon = IconUsers;
    label = 'videothumbnail.demote';

    /**
     * Handles clicking / pressing the button, and demoting the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(DemoteToVisitorDialog, { participantID }));
    }
}
