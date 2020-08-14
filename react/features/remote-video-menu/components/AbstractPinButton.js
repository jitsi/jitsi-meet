// @flow

import { IconPin } from '../../base/icons';
import { pinParticipant } from '../../base/participants';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

export type Props = AbstractButtonProps & {

    /**
     * True if tile view is currently enabled.
     */
    _tileViewEnabled: boolean,

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
 * An abstract remote video menu button which kicks the remote participant.
 */
export default class AbstractPinButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.pin';
    icon = IconPin;
    label = 'videothumbnail.pin';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        // Pin participant, it will automatically exit the tile view
        dispatch(pinParticipant(this.props.participantID));
    }
}
