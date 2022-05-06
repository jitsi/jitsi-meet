import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../../../analytics';
import { appNavigate } from '../../../../app/actions';

import EndMeetingIcon from './EndMeetingIcon';
import styles from './styles';

/**
 * Button for ending meeting from carmode.
 *
 * @returns {JSX.Element} - The end meeting button.
 */
const EndMeetingButton = () : JSX.Element => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onSelect = useCallback(() => {
        sendAnalytics(createToolbarEvent('hangup'));

        dispatch(appNavigate(undefined));
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('carmode.actions.leaveMeeting') }
            children = { t('carmode.actions.leaveMeeting') }
            icon = { EndMeetingIcon }
            labelStyle = { styles.endMeetingButtonLabel }
            mode = 'contained'
            onPress = { onSelect }
            style = { styles.endMeetingButton } />
    );
};

export default EndMeetingButton;
