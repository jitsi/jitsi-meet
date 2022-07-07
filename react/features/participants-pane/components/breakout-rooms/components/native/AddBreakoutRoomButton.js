// @flow

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../../../base/react/components/native/Button';
import { BUTTON_TYPES } from '../../../../../base/react/constants';
import { createBreakoutRoom } from '../../../../../breakout-rooms/actions';

import styles from './styles';

const AddBreakoutRoomButton = () => {
    const dispatch = useDispatch();

    const onAdd = useCallback(() =>
        dispatch(createBreakoutRoom())
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'breakoutRooms.actions.add'
            label = 'breakoutRooms.actions.add'
            onPress = { onAdd }
            style = { styles.addButton }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};

export default AddBreakoutRoomButton;
