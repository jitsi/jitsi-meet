import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
import { openDialog } from '../../../base/dialog/actions';
import { IconCloseLarge, IconDotsHorizontal } from '../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import Button from '../../../base/ui/components/web/Button';
import ClickableIcon from '../../../base/ui/components/web/ClickableIcon';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { findAncestorByClass } from '../../../base/ui/functions.web';
import { isAddBreakoutRoomButtonVisible } from '../../../breakout-rooms/functions';
import MuteEveryoneDialog from '../../../video-menu/components/web/MuteEveryoneDialog';
import { close } from '../../actions.web';
import {
    getParticipantsPaneOpen,
    isMoreActionsVisible,
    isMuteAllVisible
} from '../../functions';
import { AddBreakoutRoomButton } from '../breakout-rooms/components/web/AddBreakoutRoomButton';
import { RoomList } from '../breakout-rooms/components/web/RoomList';
import { FooterContextMenu } from './FooterContextMenu';
import LobbyParticipants from './LobbyParticipants';
import MeetingParticipants from './MeetingParticipants';
import VisitorsList from './VisitorsList';
import Spinner from '../../../base/ui/components/web/Spinner'; // CHANGED: Added import for Spinner component

const useStyles = makeStyles()(theme => {
    return {
        participantsPane: {
            backgroundColor: theme.palette.ui01,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
            transition: 'width .16s ease-in-out',
            width: '315px',
            zIndex: 0,
            display: 'flex',
            flexDirection: 'column',
            fontWeight: 600,
            height: '100%',
            [['& > *:first-child', '& > *:last-child'] as any]: {
                flexShrink: 0
            },
            '@media (max-width: 580px)': {
                height: '100dvh',
                position: 'fixed',
                left: 0,
                right: 0,
                top: 0,
                width: '100%'
            }
        },
        container: {
            boxSizing: 'border-box',
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            padding: `0 ${participantsPaneTheme.panePadding}px`,
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
            boxSizing: 'border-box',
            display: 'flex',
            height: '60px',
            padding: `0 ${participantsPaneTheme.panePadding}px`,
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
            position: 'relative'
        },
        // CHANGED: Added new style for the loading overlay to center the spinner
        loadingOverlay: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'rgba(0, 0, 0, 0.1)', // Slight overlay for visibility
            zIndex: 1 // Ensure it sits above other content
        }
    };
});

const ParticipantsPane = () => {
    const { classes, cx } = useStyles();
    const paneOpen = useSelector(getParticipantsPaneOpen);
    const isBreakoutRoomsSupported = useSelector((state: IReduxState) =>
        state['features/base/conference']?.conference?.getBreakoutRooms()?.isSupported()
    );
    const showAddRoomButton = useSelector(isAddBreakoutRoomButtonVisible);
    const showFooter = useSelector(isLocalParticipantModerator);
    const showMuteAllButton = useSelector(isMuteAllVisible);
    const showMoreActionsButton = useSelector(isMoreActionsVisible);
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const [contextOpen, setContextOpen] = useState(false);
    const [searchString, setSearchString] = useState('');
    // CHANGED: Added loading state to track when the participant list is updating
    const [loading, setLoading] = useState(true); // Start as true to show spinner on mount

    const onWindowClickListener = useCallback((e) => {
        if (contextOpen && !findAncestorByClass(e.target, classes.footerMoreContainer)) {
            setContextOpen(false);
        }
    }, [contextOpen, classes.footerMoreContainer]); // CHANGED: Added classes.footerMoreContainer to deps for accuracy

    useEffect(() => {
        window.addEventListener('click', onWindowClickListener);

        // CHANGED: Added logic to simulate loading on mount or search change
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 1000); // 1s delay as a demo

        return () => {
            window.removeEventListener('click', onWindowClickListener);
            clearTimeout(timer); // CHANGED: Added cleanup for the timer to prevent memory leaks
        };
    }, [onWindowClickListener, searchString]); // CHANGED: Updated deps to include onWindowClickListener

    const onClosePane = useCallback(() => {
        dispatch(close());
    }, [dispatch]); // CHANGED: Added dispatch to deps for consistency

    const onDrawerClose = useCallback(() => {
        setContextOpen(false);
    }, []);

    const onMuteAll = useCallback(() => {
        dispatch(openDialog(MuteEveryoneDialog));
    }, [dispatch]); // CHANGED: Added dispatch to deps for consistency

    const onToggleContext = useCallback(() => {
        setContextOpen(open => !open);
    }, []);

    if (!paneOpen) {
        return null;
    }

    return (
        <div className={cx('participants_pane', classes.participantsPane)}>
            <div className={classes.header}>
                <ClickableIcon
                    accessibilityLabel={t('participantsPane.close', 'Close')}
                    icon={IconCloseLarge}
                    onClick={onClosePane} />
            </div>
            <div className={classes.container}>
                {/* CHANGED: Added conditional rendering for loading spinner */}
                {loading ? (
                    <div className={classes.loadingOverlay}>
                        <Spinner />
                    </div>
                ) : (
                    <>
                        <VisitorsList />
                        <br className={classes.antiCollapse} />
                        <LobbyParticipants />
                        <br className={classes.antiCollapse} />
                        <MeetingParticipants
                            searchString={searchString}
                            setSearchString={setSearchString} />
                        {isBreakoutRoomsSupported && <RoomList searchString={searchString} />}
                        {showAddRoomButton && <AddBreakoutRoomButton />}
                    </>
                )}
            </div>
            {showFooter && (
                <div className={classes.footer}>
                    {showMuteAllButton && (
                        <Button
                            accessibilityLabel={t('participantsPane.actions.muteAll')}
                            labelKey={'participantsPane.actions.muteAll'}
                            onClick={onMuteAll}
                            type={BUTTON_TYPES.SECONDARY} />
                    )}
                    {showMoreActionsButton && (
                        <div className={classes.footerMoreContainer}>
                            <Button
                                accessibilityLabel={t('participantsPane.actions.moreModerationActions')}
                                icon={IconDotsHorizontal}
                                id="participants-pane-context-menu"
                                onClick={onToggleContext}
                                type={BUTTON_TYPES.SECONDARY} />
                            <FooterContextMenu
                                isOpen={contextOpen}
                                onDrawerClose={onDrawerClose}
                                onMouseLeave={onToggleContext} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ParticipantsPane;