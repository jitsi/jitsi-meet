import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { IconAddUser } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { beginAddPeople } from '../../../invite/actions';
import { NOTIFY_CLICK_MODE } from '../../../toolbox/types';

const INVITE_BUTTON_KEY = 'invite';

export const InviteButton = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const notifyMode = useSelector(
        (state: IReduxState) => state['features/toolbox'].buttonsWithNotifyClick?.get(INVITE_BUTTON_KEY));

    const onInvite = useCallback(() => {
        if (notifyMode) {
            APP.API.notifyToolbarButtonClicked(
                INVITE_BUTTON_KEY, notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY
            );
        }

        if (notifyMode === NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY) {
            return;
        }

        sendAnalytics(createToolbarEvent(INVITE_BUTTON_KEY));
        dispatch(beginAddPeople());
    }, [ dispatch, notifyMode ]);

    return (
        <Button
            accessibilityLabel = { t('participantsPane.actions.invite') }
            fullWidth = { true }
            icon = { IconAddUser }
            labelKey = { 'participantsPane.actions.invite' }
            onClick = { onInvite }
            type = { BUTTON_TYPES.PRIMARY } />
    );
};
