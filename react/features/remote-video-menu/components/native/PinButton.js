// @flow

import { translate } from '../../../base/i18n';
import { IconPin } from '../../../base/icons';
import { pinParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { shouldDisplayTileView } from '../../../video-layout/functions';

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
 * A remote video menu button which pins a participant and exist the tile view.
 */
class PinButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.show';
    icon = IconPin;
    label = 'videothumbnail.show';

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

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        visible: shouldDisplayTileView(state)
    };
}

export default translate(connect(_mapStateToProps)(PinButton));
