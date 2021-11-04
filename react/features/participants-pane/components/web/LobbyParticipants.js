// @flow

import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { Icon, IconCheck, IconClose } from '../../../base/icons';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { admitMultiple } from '../../../lobby/actions.web';
import { getLobbyEnabled, getKnockingParticipants } from '../../../lobby/functions';
import { Drawer, JitsiPortal } from '../../../toolbox/components/web';
import { showOverflowDrawer } from '../../../toolbox/functions';
import { useLobbyActions, useParticipantDrawer } from '../../hooks';

import LobbyParticipantItems from './LobbyParticipantItems';

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
        headingContainer: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between'
        },
        heading: {
            ...withPixelLineHeight(theme.typography.heading7),
            color: theme.palette.text02
        },
        link: {
            ...withPixelLineHeight(theme.typography.labelBold),
            color: theme.palette.link01,
            cursor: 'pointer'
        }
    };
});

/**
 * Component used to display a list of participants waiting in the lobby.
 *
 * @returns {ReactNode}
 */
export default function LobbyParticipants() {
    const lobbyEnabled = useSelector(getLobbyEnabled);
    const participants = useSelector(getKnockingParticipants);
    const { t } = useTranslation();
    const classes = useStyles();
    const dispatch = useDispatch();
    const admitAll = useCallback(() => {
        dispatch(admitMultiple(participants));
    }, [ dispatch, participants ]);
    const overflowDrawer = useSelector(showOverflowDrawer);
    const [ drawerParticipant, closeDrawer, openDrawerForParticipant ] = useParticipantDrawer();
    const [ admit, reject ] = useLobbyActions(drawerParticipant, closeDrawer);

    if (!lobbyEnabled || !participants.length) {
        return null;
    }

    return (
        <>
            <div className = { classes.headingContainer }>
                <div className = { classes.heading }>
                    {t('participantsPane.headings.lobby', { count: participants.length })}
                </div>
                <div
                    className = { classes.link }
                    onClick = { admitAll }>{t('lobby.admitAll')}</div>
            </div>
            <LobbyParticipantItems
                openDrawerForParticipant = { openDrawerForParticipant }
                overflowDrawer = { overflowDrawer }
                participants = { participants } />
            <JitsiPortal>
                <Drawer
                    isOpen = { Boolean(drawerParticipant && overflowDrawer) }
                    onClose = { closeDrawer }>
                    <ul className = { classes.drawerActions }>
                        <li className = { classes.drawerItem }>
                            <Avatar
                                className = { classes.icon }
                                participantId = { drawerParticipant && drawerParticipant.participantID }
                                size = { 20 } />
                            <span>{ drawerParticipant && drawerParticipant.displayName }</span>
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
            </JitsiPortal>
        </>
    );
}
