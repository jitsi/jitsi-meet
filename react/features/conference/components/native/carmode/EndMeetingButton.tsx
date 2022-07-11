import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../../../analytics';
import { appNavigate } from '../../../../app/actions';
import Button from '../../../../base/react/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/react/constants';

import EndMeetingIcon from './EndMeetingIcon';
import styles from './styles';

/**
 * Button for ending meeting from carmode.
 *
 * @returns {JSX.Element} - The end meeting button.
 */
const EndMeetingButton = () : JSX.Element => {
    const dispatch = useDispatch();

    const onSelect = useCallback(() => {
        sendAnalytics(createToolbarEvent('hangup'));

        dispatch(appNavigate(undefined));
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'carmode.actions.leaveMeeting'
            icon = { EndMeetingIcon }
            label = 'carmode.actions.leaveMeeting'
            onPress = { onSelect }
            style = { styles.endMeetingButton }
            type = { BUTTON_TYPES.DESTRUCTIVE } />
    );
};

export default EndMeetingButton;
