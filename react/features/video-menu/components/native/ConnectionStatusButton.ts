import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconInfoCircle } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { showConnectionStatus } from '../../../participants-pane/actions.native';

export interface IProps extends AbstractButtonProps {

    /**
     * The ID of the participant that this button is supposed to pin.
     */
    participantID: string;
}

/**
 * A remote video menu button which shows the connection statistics.
 */
class ConnectionStatusButton extends AbstractButton<IProps> {
    override icon = IconInfoCircle;
    override label = 'videothumbnail.connectionInfo';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(showConnectionStatus(participantID));
    }
}

export default translate(connect()(ConnectionStatusButton));
