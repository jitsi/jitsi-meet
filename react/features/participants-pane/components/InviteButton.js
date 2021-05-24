// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { Icon, IconInviteMore } from '../../base/icons';
import { beginAddPeople } from '../../invite';

import { ParticipantInviteButton } from './styled';

export const InviteButton = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const onInvite = useCallback(() => {
        sendAnalytics(createToolbarEvent('invite'));
        dispatch(beginAddPeople());
    }, [ dispatch ]);

    return (
        <ParticipantInviteButton
            aria-label = { t('toolbar.accessibilityLabel.invite') }
            onClick = { onInvite }>
            <Icon
                size = { 20 }
                src = { IconInviteMore } />
            <span>{t('participantsPane.actions.invite')}</span>
        </ParticipantInviteButton>
    );
};
