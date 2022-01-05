// @flow

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconInfo } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

import ConnectionStatusComponent from './ConnectionStatusComponent';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant that this button is supposed to pin.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * A remote video menu button which shows the connection statistics.
 */
class ConnectionStatusButton extends AbstractButton<Props, *> {
    icon = IconInfo;
    label = 'videothumbnail.connectionInfo';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID } = this.props;

        dispatch(openDialog(ConnectionStatusComponent, {
            participantID
        }));
    }
}

export default translate(connect()(ConnectionStatusButton));
