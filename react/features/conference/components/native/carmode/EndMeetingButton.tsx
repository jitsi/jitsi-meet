import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { createToolbarEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { appNavigate } from '../../../../app/actions.native';
import Button from '../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants.native';

import EndMeetingIcon from './EndMeetingIcon';
import styles from './styles';

/**
 * Button for ending meeting from carmode.
 *
 * @returns {JSX.Element} - The end meeting button.
 */
const EndMeetingButton = (): JSX.Element => {
    const dispatch = useDispatch();

    const onSelect = useCallback(() => {
        sendAnalytics(createToolbarEvent('hangup'));

        dispatch(appNavigate(undefined));
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = 'toolbar.accessibilityLabel.leaveConference'
            icon = { EndMeetingIcon }
            labelKey = 'toolbar.leaveConference'
            onClick = { onSelect }
            style = { styles.endMeetingButton }
            type = { BUTTON_TYPES.DESTRUCTIVE } />
    );
};

export default EndMeetingButton;
