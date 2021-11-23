// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { createBreakoutRoomsEvent, sendAnalytics } from '../../../analytics';
import { moveToRoom } from '../../actions';

import styles from './styles';

const LeaveBreakoutRoomButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onLeave = useCallback(() => {
        sendAnalytics(createBreakoutRoomsEvent('leave'));
        dispatch(moveToRoom());
    }
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.leaveBreakoutRoom') }
            children = { t('breakoutRooms.actions.leaveBreakoutRoom') }
            labelStyle = { styles.leaveButtonLabel }
            mode = 'contained'
            onPress = { onLeave }
            style = { styles.transparentButton } />
    );
};

export default LeaveBreakoutRoomButton;
