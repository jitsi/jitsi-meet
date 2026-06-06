import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { createBreakoutRoomsEvent, createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { appNavigate } from '../../../app/actions';
import { IReduxState } from '../../../app/types';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { endConference } from '../../../base/conference/actions';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { PARTICIPANT_ROLE } from '../../../base/participants/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { moveToRoom } from '../../../breakout-rooms/actions';
import { isInBreakoutRoom } from '../../../breakout-rooms/functions';

/**
 * Menu presenting options to leave a room or meeting and to end meeting.
 *
 * @returns {JSX.Element} - The hangup menu.
 */
function HangupMenu() {
    const dispatch = useDispatch();
    const _styles: any = useSelector((state: IReduxState) => ColorSchemeRegistry.get(state, 'Toolbox'));
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isModerator = useSelector((state: IReduxState) =>
        getLocalParticipant(state)?.role === PARTICIPANT_ROLE.MODERATOR);
    const { DESTRUCTIVE, SECONDARY } = BUTTON_TYPES;

    const handleEndConference = useCallback(() => {
        dispatch(hideSheet());
        sendAnalytics(createToolbarEvent('endmeeting'));
        dispatch(endConference());
    }, [ hideSheet ]);

    const handleLeaveConference = useCallback(() => {
        dispatch(hideSheet());
        sendAnalytics(createToolbarEvent('hangup'));
        dispatch(appNavigate(undefined));
    }, [ hideSheet ]);

    const handleLeaveBreakoutRoom = useCallback(() => {
        dispatch(hideSheet());
        sendAnalytics(createBreakoutRoomsEvent('leave'));
        dispatch(moveToRoom());
    }, [ hideSheet ]);

    return (
        <BottomSheet>
            <View style = { _styles.hangupMenuContainer }>
                { isModerator && <Button
                    accessibilityLabel = 'toolbar.endConference'
                    labelKey = 'toolbar.endConference'
                    onClick = { handleEndConference }
                    style = { _styles.hangupButton }
                    type = { DESTRUCTIVE } /> }
                <Button
                    accessibilityLabel = 'toolbar.leaveConference'
                    labelKey = 'toolbar.leaveConference'
                    onClick = { handleLeaveConference }
                    style = { _styles.hangupButton }
                    type = { SECONDARY } />
                { inBreakoutRoom && <Button
                    accessibilityLabel = 'breakoutRooms.actions.leaveBreakoutRoom'
                    labelKey = 'breakoutRooms.actions.leaveBreakoutRoom'
                    onClick = { handleLeaveBreakoutRoom }
                    style = { _styles.hangupButton }
                    type = { SECONDARY } /> }
            </View>
        </BottomSheet>
    );
}

export default HangupMenu;
