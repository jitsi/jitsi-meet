import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { autoAssignToBreakoutRooms } from '../../actions';

import styles from './styles';

/**
 * Button to auto assign participants to breakout rooms.
 *
 * @returns {JSX.Element} - The auto assign button.
 */
const AutoAssignButton = () => {
    const dispatch = useDispatch();

    const onAutoAssign = useCallback(() => {
        dispatch(autoAssignToBreakoutRooms());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'breakoutRooms.actions.autoAssign'
            labelKey = 'breakoutRooms.actions.autoAssign'
            labelStyle = { styles.autoAssignLabel }
            onClick = { onAutoAssign }
            style = { styles.autoAssignButton }
            type = { BUTTON_TYPES.TERTIARY } />
    );
};

export default AutoAssignButton;
