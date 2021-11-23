// @flow

import { createBreakoutRoomsEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconRingGroup } from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { sendParticipantToRoom } from '../../../breakout-rooms/actions';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * ID of the participant to send to breakout room.
     */
    participantID: string,

    /**
     * Room to send participant to.
     */
    room: Object,

    /**
     * Translation function.
     */
    t: Function
};

/**
 * An abstract remote video menu button which sends the remote participant to a breakout room.
 */
class SendToBreakoutRoom extends AbstractButton<Props, *> {
    accessibilityLabel = 'breakoutRooms.actions.sendToBreakoutRoom';
    icon = IconRingGroup;

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
    _handleClick() {
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
 * @returns {Props}
 */
function mapStateToProps(state) {
    return {
        visible: isLocalParticipantModerator(state)
    };
}

export default translate(connect(mapStateToProps)(SendToBreakoutRoom));
