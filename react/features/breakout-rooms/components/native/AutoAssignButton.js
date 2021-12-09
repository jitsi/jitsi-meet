// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { autoAssignToBreakoutRooms } from '../../actions';

import styles from './styles';

const AutoAssignButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onAutoAssign = useCallback(() => {
        dispatch(autoAssignToBreakoutRooms());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.autoAssign') }
            children = { t('breakoutRooms.actions.autoAssign') }
            labelStyle = { styles.autoAssignLabel }
            mode = 'contained'
            onPress = { onAutoAssign }
            style = { styles.transparentButton } />
    );
};

export default AutoAssignButton;
