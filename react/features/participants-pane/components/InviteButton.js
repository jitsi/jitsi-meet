// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { Icon, IconInviteMore } from '../../base/icons';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { beginAddPeople } from '../../invite';

import { useButtonStyles } from './styled';

const useStyles = makeStyles(theme => {
    return {
        fullLength: {
            minHeight: 40,
            marginBottom: 16,
            width: '100%',
            ...withPixelLineHeight(theme.typography.labelButton),

            '@media (max-width: 580px)': {
                minHeight: 48,
                ...withPixelLineHeight(theme.typography.labelButtonLarge)
            }
        },
        icon: {
            marginRight: 8
        }
    };
});

export const InviteButton = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const buttonClasses = useButtonStyles();
    const classes = useStyles();

    const onInvite = useCallback(() => {
        sendAnalytics(createToolbarEvent('invite'));
        dispatch(beginAddPeople());
    }, [ dispatch ]);

    return (
        <button
            aria-label = { t('participantsPane.actions.invite') }
            className = { clsx(buttonClasses.button, classes.fullLength) }
            onClick = { onInvite }>
            <Icon
                className = { classes.icon }
                size = { 20 }
                src = { IconInviteMore } />
            <span>{t('participantsPane.actions.invite')}</span>
        </button>
    );
};
