// @flow

import { type Dispatch } from 'redux';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconMeetingUnlocked, IconMeetingLocked } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { moveToRoom } from '../../actions';
import { isInBreakoutRoom, getRooms } from '../../functions';

import { default as BreakoutRoomPickerDialog } from './BreakoutRoomPickerDialog';

/**
 * The type of the React {@code Component} props of {@link RaiseHandButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the local participant is in a breakout room.
     */
    inBreakoutRoom: boolean,

    /**
     * Whether the breakout room button is visible.
     */
    visible: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};

/**
 * An implementation of a button to raise or lower hand.
 */
class BreakoutRoomButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.breakoutRoom';
    icon = IconMeetingUnlocked;
    label = 'toolbar.joinBreakoutRoom';
    toggledLabel = 'toolbar.leaveBreakoutRoom';
    toggledIcon = IconMeetingLocked;

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this._toggleBreakoutRoom();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props.inBreakoutRoom;
    }

    /**
     * Toggles the rased hand status of the local participant.
     *
     * @returns {void}
     */
    _toggleBreakoutRoom() {
        const join = !this.props.inBreakoutRoom;

        sendAnalytics(createToolbarEvent('join.breakoutRoom', { join }));

        if (join) {
            this.props.dispatch(openDialog(BreakoutRoomPickerDialog));
        } else {
            this.props.dispatch(moveToRoom());
        }
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state): Object {
    const inBreakoutRoom = isInBreakoutRoom(state);
    const rooms = Object.keys(getRooms(state));

    return {
        inBreakoutRoom,
        visible: rooms.length > 1
    };
}

export default translate(connect(_mapStateToProps)(BreakoutRoomButton));
