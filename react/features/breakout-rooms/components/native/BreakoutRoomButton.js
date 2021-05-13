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
import { moveToMainRoom } from '../../actions';
import { getIsInBreakoutRoom, selectBreakoutRooms } from '../../functions';

import { default as BreakoutRoomPickerDialog } from './BreakoutRoomPickerDialog';

/**
 * The type of the React {@code Component} props of {@link RaiseHandButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether the local participant is in a breakout room.
     */
    isInBreakoutRoom: boolean,

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
        return this.props.isInBreakoutRoom;
    }

    /**
     * Toggles the rased hand status of the local participant.
     *
     * @returns {void}
     */
    _toggleBreakoutRoom() {
        const join = !this.props.isInBreakoutRoom;

        sendAnalytics(createToolbarEvent('join.breakoutRoom', { join }));

        if (join) {
            this.props.dispatch(openDialog(BreakoutRoomPickerDialog));
        } else {
            this.props.dispatch(moveToMainRoom());
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
    const isInBreakoutRoom = getIsInBreakoutRoom(state);

    return {
        isInBreakoutRoom,
        visible: selectBreakoutRooms(state).length > 0
    };
}

export default translate(connect(_mapStateToProps)(BreakoutRoomButton));
