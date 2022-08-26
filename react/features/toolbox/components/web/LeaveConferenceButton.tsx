/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// @ts-ignore
import { createToolbarEvent, sendAnalytics } from '../../../analytics';
// @ts-ignore
import { leaveConference } from '../../../base/conference/actions';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants';

/**
 * Button to leave the conference.
 *
 * @returns {JSX.Element} - The leave conference button.
 */
export const LeaveConferenceButton = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const onLeaveConference = useCallback(() => {
        sendAnalytics(createToolbarEvent('hangup'));
        dispatch(leaveConference());
    }, [ dispatch ]);

    return (
        <Button
            accessibilityLabel = { t('toolbar.accessibilityLabel.leaveConference') }
            fullWidth = { true }
            label = { t('toolbar.leaveConference') }
            onClick = { onLeaveConference }
            type = { BUTTON_TYPES.SECONDARY } />
    );
};
