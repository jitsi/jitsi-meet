// @flow

import { makeStyles } from '@material-ui/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { Icon, IconInviteMore } from '../../../base/icons';
import { beginAddPeople } from '../../../invite';

import ParticipantPaneBaseButton from './ParticipantPaneBaseButton';

const useStyles = makeStyles(theme => {
    return {
        button: {
            width: '100%',

            '& > *:not(:last-child)': {
                marginRight: `${theme.spacing(2)}px`
            }
        }
    };
});

export const InviteButton = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const styles = useStyles();

    const onInvite = useCallback(() => {
        sendAnalytics(createToolbarEvent('invite'));
        dispatch(beginAddPeople());
    }, [ dispatch ]);

    return (
        <ParticipantPaneBaseButton
            accessibilityLabel = { t('participantsPane.actions.invite') }
            className = { styles.button }
            onClick = { onInvite }
            primary = { true }>
            <Icon
                size = { 20 }
                src = { IconInviteMore } />
            <span>{t('participantsPane.actions.invite')}</span>
        </ParticipantPaneBaseButton>
    );
};
