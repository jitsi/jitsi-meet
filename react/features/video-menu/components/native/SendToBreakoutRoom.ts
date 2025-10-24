import { connect } from 'react-redux';

import { createBreakoutRoomsEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconRingGroup } from '../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { sendParticipantToRoom } from '../../../breakout-rooms/actions';
import { IRoom } from '../../../breakout-rooms/types';

export interface IProps extends AbstractButtonProps {

    /**
     * ID of the participant to send to breakout room.
     */
    participantID: string;

    /**
     * Room to send participant to.
     */
    room: IRoom;
}

/**
 * An abstract remote video menu button which sends the remote participant to a breakout room.
 */
class SendToBreakoutRoom extends AbstractButton<IProps> {
    override accessibilityLabel = 'breakoutRooms.actions.sendToBreakoutRoom';
    override icon = IconRingGroup;

    /**
     * Gets the current label.
     *
     * @returns {string}
     */
    _getLabel() {
        const { t, room } = this.props;

        return room.name || t('breakoutRooms.mainRoom');
    }

    /**
     * Handles clicking / pressing the button, and asks the participant to unmute.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, participantID, room } = this.props;

        sendAnalytics(createBreakoutRoomsEvent('send.participant.to.room'));
        dispatch(sendParticipantToRoom(participantID, room.id));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - Properties of component.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    return {
        visible: isLocalParticipantModerator(state)
    };
}

export default translate(connect(mapStateToProps)(SendToBreakoutRoom));
