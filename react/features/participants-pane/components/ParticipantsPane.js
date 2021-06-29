// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { Icon, IconClose, IconHorizontalPoints } from '../../base/icons';
import {
    getParticipantCount,
    isEveryoneModerator,
    isLocalParticipantModerator
} from '../../base/participants';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { Drawer, DrawerPortal } from '../../toolbox/components/web';
import { showOverflowDrawer } from '../../toolbox/functions';
import { MuteEveryoneDialog } from '../../video-menu/components/';
import { close } from '../actions';
import { getParticipantsPaneOpen } from '../functions';

import { FooterContextMenu } from './FooterContextMenu';
import { LobbyParticipantList } from './LobbyParticipantList';
import { MeetingParticipantList } from './MeetingParticipantList';

const useStyles = makeStyles(t => {
    return {
        root: {
            backgroundColor: t.palette.uiBackground,
            position: 'relative',
            zIndex: 0,

            '@media (max-width: 580px)': {
                height: '100%',
                position: 'fixed',
                width: '100%'
            }
        },
        closed: {
            display: 'none'
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            fontWeight: 600,
            height: '100%',
            width: 315,

            '@media (max-width: 580px)': {
                width: '100%'
            }
        },
        close: {
            cursor: 'pointer'
        },
        button: {
            alignItems: 'center',
            backgroundColor: t.palette.action02,
            border: 0,
            borderRadius: t.shape.borderRadius,
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 16px',
            ...withPixelLineHeight(t.typography.labelButton),

            '&:hover': {
                backgroundColor: t.palette.action02Hover
            }
        },
        header: {
            alignItems: 'center',
            boxSizing: 'border-box',
            display: 'flex',
            height: '60px',
            justifyContent: 'flex-end',
            padding: '0 20px'
        },
        iconButton: {
            height: 40,
            marginLeft: t.spacing(3),
            width: 40
        },
        listContainer: {
            boxSizing: 'border-box',
            flex: '1 1 0%',
            overflowY: 'auto',
            position: 'relative',
            padding: '0px 16px'
        },
        ellipsisContainer: {
            position: 'relative'
        },
        footer: {
            backgroundColor: t.palette.uiBackground,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '24px 16px'
        }
    };
});

export const ParticipantsPane = () => {
    const dispatch = useDispatch();
    const paneOpen = useSelector(getParticipantsPaneOpen);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const participantsCount = useSelector(getParticipantCount);
    const everyoneModerator = useSelector(isEveryoneModerator);
    const showContextMenu = !everyoneModerator && participantsCount > 2;
    const overflowDrawer = useSelector(showOverflowDrawer);
    const classes = useStyles();

    const [ contextOpen, setContextOpen ] = useState(false);
    const [ drawerIsOpen, setDrawerOpen ] = useState(false);
    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setContextOpen(false);
    }, [ setDrawerOpen ]);
    const { t } = useTranslation();

    const closePane = useCallback(() => dispatch(close(), [ dispatch ]));
    const closePaneKeyPress = useCallback(e => {
        if (closePane && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            closePane();
        }
    }, [ closePane ]);
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)), [ dispatch ]);
    const toggleContext = useCallback(() => {
        setContextOpen(!contextOpen);
        overflowDrawer && setDrawerOpen(true);
    }, [ contextOpen, setContextOpen, overflowDrawer ]);

    return (
        <>
            <div className = { clsx(classes.root, !paneOpen && classes.closed) }>
                <div className = { classes.content }>
                    <div className = { classes.header }>
                        <Icon
                            aria-label = { t('participantsPane.close', 'Close') }
                            className = { classes.close }
                            onClick = { closePane }
                            onKeyPress = { closePaneKeyPress }
                            role = 'button'
                            src = { IconClose }
                            tabIndex = { 0 } />
                    </div>
                    <div className = { classes.listContainer }>
                        <LobbyParticipantList />
                        <MeetingParticipantList />
                    </div>

                    {isLocalModerator && (
                        <div className = { classes.footer }>
                            <button
                                className = { classes.button }
                                onClick = { muteAll }>
                                {t('participantsPane.actions.muteAll')}
                            </button>

                            {showContextMenu && (
                                <div className = { classes.ellipsisContainer }>
                                    <button
                                        aria-label = 'Toggle more menu'
                                        className = { clsx(classes.button, classes.iconButton) }
                                        id = 'participants-pane-context-menu'
                                        onClick = { toggleContext }>
                                        <Icon src = { IconHorizontalPoints } />
                                    </button>
                                    { contextOpen
                                      && !overflowDrawer
                                      && <FooterContextMenu onMouseLeave = { toggleContext } /> }
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <DrawerPortal>
                <Drawer
                    isOpen = { drawerIsOpen }
                    onClose = { closeDrawer }>
                    { showContextMenu
                      && contextOpen
                      && overflowDrawer
                      && <FooterContextMenu /> }
                </Drawer>
            </DrawerPortal>
        </>
    );
};
