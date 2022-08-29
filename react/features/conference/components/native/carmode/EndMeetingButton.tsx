/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

// @ts-ignore
import { createToolbarEvent, sendAnalytics } from '../../../../analytics';
// @ts-ignore
import { appNavigate } from '../../../../app/actions';
import Button from '../../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../../base/ui/constants';

import EndMeetingIcon from './EndMeetingIcon';
// @ts-ignore
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
            accessibilityLabel = 'toolbar.accessibilityLabel.leaveConference'
            icon = { EndMeetingIcon }
            labelKey = 'toolbar.leaveConference'
            onClick = { onSelect }
            style = { styles.endMeetingButton }
            type = { BUTTON_TYPES.DESTRUCTIVE } />
    );
};

export default EndMeetingButton;
