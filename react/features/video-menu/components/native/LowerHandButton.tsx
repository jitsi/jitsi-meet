import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import { IJitsiConference } from '../../../base/conference/reducer';
import { translate } from '../../../base/i18n/functions';
import { IconRaiseHand } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { LOWER_HAND_MESSAGE } from '../../../base/tracks/constants';

interface IProps extends AbstractButtonProps {

    /**
     * The current conference.
     */
    _conference: IJitsiConference | undefined;

    /**
     * The ID of the participant object that this button is supposed to
     * ask to lower the hand.
     */
    participantId: String | undefined;
}

/**
 * Implements a React {@link Component} which displays a button for lowering certain
 * participant raised hands.
 *
 * @returns {JSX.Element}
 */
class LowerHandButton extends AbstractButton<IProps> {
    override icon = IconRaiseHand;
    override accessibilityLabel = 'participantsPane.actions.lowerHand';
    override label = 'participantsPane.actions.lowerHand';

    /**
     * Handles clicking / pressing the button, and asks the participant to lower hand.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { participantId, _conference } = this.props;

        _conference?.sendEndpointMessage(
            participantId,
            {
                name: LOWER_HAND_MESSAGE
            }
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - Properties of component.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantID } = ownProps;
    const currentConference = getCurrentConference(state);

    return {
        _conference: currentConference,
        participantId: participantID
    };
}

export default translate(connect(mapStateToProps)(LowerHandButton));
