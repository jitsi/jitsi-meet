// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '../../base/avatar';
import { Icon, IconCheck, IconClose } from '../../base/icons';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { Drawer, DrawerPortal } from '../../toolbox/components/web';
import { ACTION_TRIGGER, MEDIA_STATE } from '../constants';
import { useLobbyActions, useDrawer } from '../functions';

import { ParticipantItem } from './ParticipantItem';
import { useButtonStyles } from './styled';

type Props = {

    /**
     * If an overflow drawer should be displayed.
     */
    overflowDrawer: boolean,

    /**
     * Participant reference
     */
    participant: Object
};

const useStyles = makeStyles(theme => {
    return {
        drawerActions: {
            listStyleType: 'none',
            margin: 0,
            padding: 0
        },
        drawerItem: {
            alignItems: 'center',
            color: theme.palette.text01,
            display: 'flex',
            padding: '12px 16px',
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),

            '&:first-child': {
                marginTop: '15px'
            },

            '&:hover': {
                cursor: 'pointer',
                background: theme.palette.action02
            }
        },
        icon: {
            marginRight: 16
        },
        actionButton: {
            height: '32px',
            padding: '6px 10px'
        }
    };
});

export const LobbyParticipantItem = ({
    overflowDrawer,
    participant
}: Props) => {
    const [ admit, reject ] = useLobbyActions(participant);
    const [ drawerIsOpen, openDrawer, closeDrawer ] = useDrawer(false);
    const onClick = overflowDrawer ? openDrawer : undefined;
    const { t } = useTranslation();
    const classes = useStyles();
    const buttonClasses = useButtonStyles();

    return (
        <>
            <ParticipantItem
                actionsTrigger = { ACTION_TRIGGER.PERMANENT }
                audioMediaState = { MEDIA_STATE.NONE }
                name = { participant.name }
                onClick = { onClick }
                participant = { participant }
                videoMuteState = { MEDIA_STATE.NONE }>
                { !overflowDrawer
                        && <>
                            <button
                                className = {
                                    clsx(buttonClasses.button, buttonClasses.buttonSecondary, classes.actionButton)
                                }
                                onClick = { reject }>
                                {t('lobby.reject')}
                            </button>
                            <button
                                className = { clsx(buttonClasses.button, classes.actionButton) }
                                onClick = { admit }>
                                {t('lobby.admit')}
                            </button>

                        </>
                }
            </ParticipantItem>

            <DrawerPortal>
                <Drawer
                    isOpen = { drawerIsOpen }
                    onClose = { closeDrawer }>
                    <ul className = { classes.drawerActions }>
                        <li className = { classes.drawerItem }>
                            <Avatar
                                className = { classes.icon }
                                participantId = { participant.id }
                                size = { 20 } />
                            <span>{participant.name}</span>
                        </li>
                        <li
                            className = { classes.drawerItem }
                            onClick = { admit }>
                            <Icon
                                className = { classes.icon }
                                size = { 20 }
                                src = { IconCheck } />
                            <span>{ t('lobby.admit') }</span>
                        </li>
                        <li
                            className = { classes.drawerItem }
                            onClick = { reject }>
                            <Icon
                                className = { classes.icon }
                                size = { 20 }
                                src = { IconClose } />
                            <span>{ t('lobby.reject')}</span>
                        </li>
                    </ul>
                </Drawer>
            </DrawerPortal>
        </>
    );
};
