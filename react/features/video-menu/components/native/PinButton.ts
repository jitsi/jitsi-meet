import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconEnlarge } from '../../../base/icons/svg';
import { pinParticipant } from '../../../base/participants/actions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { shouldDisplayTileView } from '../../../video-layout/functions';

export interface IProps extends AbstractButtonProps {

    /**
     * True if tile view is currently enabled.
     */
    _tileViewEnabled?: boolean;

    /**
     * The ID of the participant that this button is supposed to pin.
     */
    participantID: string;
}

/**
 * A remote video menu button which pins a participant and exist the tile view.
 */
class PinButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.show';
    override icon = IconEnlarge;
    override label = 'videothumbnail.show';

    /**
     * Handles clicking / pressing the button, and kicks the participant.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        // Pin participant, it will automatically exit the tile view
        dispatch(pinParticipant(this.props.participantID));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { isOpen } = state['features/participants-pane'];

    return {
        visible: !isOpen && shouldDisplayTileView(state)
    };
}

export default translate(connect(_mapStateToProps)(PinButton));
