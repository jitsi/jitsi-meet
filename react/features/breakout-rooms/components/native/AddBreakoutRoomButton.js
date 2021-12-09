// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { createBreakoutRoom } from '../../actions';

import styles from './styles';

const AddBreakoutRoomButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onAdd = useCallback(() =>
        dispatch(createBreakoutRoom())
    , [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.add') }
            children = { t('breakoutRooms.actions.add') }
            labelStyle = { styles.addButtonLabel }
            mode = 'contained'
            onPress = { onAdd }
            style = { styles.addButton } />
    );
};

export default AddBreakoutRoomButton;
