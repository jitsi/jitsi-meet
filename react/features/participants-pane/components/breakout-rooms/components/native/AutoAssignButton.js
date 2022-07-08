// @flow

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../../../base/react/components/native/Button';
import { BUTTON_TYPES } from '../../../../../base/react/constants';
import { autoAssignToBreakoutRooms } from '../../../../../breakout-rooms/actions';

import styles from './styles';


const AutoAssignButton = () => {
    const dispatch = useDispatch();

    const onAutoAssign = useCallback(() => {
        dispatch(autoAssignToBreakoutRooms());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'breakoutRooms.actions.autoAssign'
            label = 'breakoutRooms.actions.autoAssign'
            labelStyle = { styles.autoAssignLabel }
            onPress = { onAutoAssign }
            style = { styles.autoAssignButton }
            type = { BUTTON_TYPES.TERTIARY } />
    );
};

export default AutoAssignButton;
