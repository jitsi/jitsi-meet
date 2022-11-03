/* eslint-disable lines-around-comment */
import { Theme } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
import { openDialog } from '../../../base/dialog/actions';
import { IconClose, IconHorizontalPoints } from '../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/web/Button';
import ClickableIcon from '../../../base/ui/components/web/ClickableIcon';
import { BUTTON_TYPES } from '../../../base/ui/constants';
import { findAncestorByClass } from '../../../base/ui/functions.web';
import { isAddBreakoutRoomButtonVisible } from '../../../breakout-rooms/functions';
// @ts-ignore
import { MuteEveryoneDialog } from '../../../video-menu/components/';
import { close } from '../../actions';
import {
    getParticipantsPaneOpen,
    isMoreActionsVisible,
    isMuteAllVisible
} from '../../functions';
import { AddBreakoutRoomButton } from '../breakout-rooms/components/web/AddBreakoutRoomButton';
// @ts-ignore
import { RoomList } from '../breakout-rooms/components/web/RoomList';

import { FooterContextMenu } from './FooterContextMenu';
import LobbyParticipants from './LobbyParticipants';
import MeetingParticipants from './MeetingParticipants';


const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            boxSizing: 'border-box' as const,
            flex: 1,
            overflowY: 'auto' as const,
            position: 'relative' as const,
            padding: `0 ${participantsPaneTheme.panePadding}px`,

            [`& > * + *:not(.${participantsPaneTheme.ignoredChildClassName})`]: {
                marginTop: theme.spacing(3)
            },

            '&::-webkit-scrollbar': {
                display: 'none'
            }
        },

        closeButton: {
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center'
        },

        header: {
            alignItems: 'center',
            boxSizing: 'border-box' as const,
            display: 'flex',
            height: `${participantsPaneTheme.headerSize}px`,
            padding: '0 20px',
            justifyContent: 'flex-end'
        },

        antiCollapse: {
            fontSize: 0,

            '&:first-child': {
                display: 'none'
            },

            '&:first-child + *': {
                marginTop: 0
            }
        },

        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            padding: `${theme.spacing(4)} ${participantsPaneTheme.panePadding}px`,

            '& > *:not(:last-child)': {
                marginRight: theme.spacing(3)
            }
        },

        footerMoreContainer: {
            position: 'relative' as const
        }
    };
});

const ParticipantsPane = () => {
    const { classes } = useStyles();
    const paneOpen = useSelector(getParticipantsPaneOpen);
    const isBreakoutRoomsSupported = useSelector((state: IReduxState) => state['features/base/conference'])
        .conference?.getBreakoutRooms()?.isSupported();
    const showAddRoomButton = useSelector(isAddBreakoutRoomButtonVisible);
    const showFooter = useSelector(isLocalParticipantModerator);
    const showMuteAllButton = useSelector(isMuteAllVisible);
    const showMoreActionsButton = useSelector(isMoreActionsVisible);
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [ contextOpen, setContextOpen ] = useState(false);
    const [ searchString, setSearchString ] = useState('');

    const onWindowClickListener = useCallback((e: any) => {
        if (contextOpen && !findAncestorByClass(e.target, classes.footerMoreContainer)) {
            setContextOpen(false);
        }
    }, [ contextOpen ]);

    useEffect(() => {
        window.addEventListener('click', onWindowClickListener);

        return () => {
            window.removeEventListener('click', onWindowClickListener);
        };
    }, []);

    const onClosePane = useCallback(() => {
        dispatch(close());
    }, []);

    const onDrawerClose = useCallback(() => {
        setContextOpen(false);
    }, []);

    const onMuteAll = useCallback(() => {
        dispatch(openDialog(MuteEveryoneDialog));
    }, []);

    const onToggleContext = useCallback(() => {
        setContextOpen(open => !open);
    }, []);

    if (!paneOpen) {
        return null;
    }

    return (
        <div className = 'participants_pane'>
            <div className = 'participants_pane-content'>
                <div className = { classes.header }>
                    <ClickableIcon
                        accessibilityLabel = { t('participantsPane.close', 'Close') }
                        icon = { IconClose }
                        onClick = { onClosePane } />
                </div>
                <div className = { classes.container }>
                    <LobbyParticipants />
                    <br className = { classes.antiCollapse } />
                    <MeetingParticipants
                        searchString = { searchString }
                        setSearchString = { setSearchString } />
                    {isBreakoutRoomsSupported && <RoomList searchString = { searchString } />}
                    {showAddRoomButton && <AddBreakoutRoomButton />}
                </div>
                {showFooter && (
                    <div className = { classes.footer }>
                        {showMuteAllButton && (
                            <Button
                                accessibilityLabel = { t('participantsPane.actions.muteAll') }
                                labelKey = { 'participantsPane.actions.muteAll' }
                                onClick = { onMuteAll }
                                type = { BUTTON_TYPES.SECONDARY } />
                        )}
                        {showMoreActionsButton && (
                            <div className = { classes.footerMoreContainer }>
                                <Button
                                    accessibilityLabel = { t('participantsPane.actions.moreModerationActions') }
                                    icon = { IconHorizontalPoints }
                                    id = 'participants-pane-context-menu'
                                    onClick = { onToggleContext }
                                    type = { BUTTON_TYPES.SECONDARY } />
                                <FooterContextMenu
                                    isOpen = { contextOpen }
                                    onDrawerClose = { onDrawerClose }
                                    onMouseLeave = { onToggleContext } />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


export default ParticipantsPane;
