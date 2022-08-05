/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

// @ts-ignore
import { createBreakoutRoomsEvent, sendAnalytics } from '../../../../../analytics';
import Button from '../../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../../base/ui/constants';
// @ts-ignore
import { moveToRoom } from '../../../../../breakout-rooms/actions';

// @ts-ignore
import styles from './styles';

/**
 * Button to leave a breakout rooms.
 *
 * @returns {JSX.Element} - The leave breakout room button.
 */
const LeaveBreakoutRoomButton = () => {
    const dispatch = useDispatch();

    const onLeave = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('leave'));
        dispatch(moveToRoom());
    }
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'breakoutRooms.actions.leaveBreakoutRoom'
            label = 'breakoutRooms.actions.leaveBreakoutRoom'
            onPress = { onLeave }
            style = { styles.button }
            type = { BUTTON_TYPES.DESTRUCTIVE } />
    );
};

export default LeaveBreakoutRoomButton;
