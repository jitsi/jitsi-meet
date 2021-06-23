// @flow

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { openDialog } from '../../base/dialog';
import {
    getParticipantCount,
    isEveryoneModerator,
    isLocalParticipantModerator
} from '../../base/participants';
import { MuteEveryoneDialog } from '../../video-menu/components/';
import { close } from '../actions';
import { classList, findStyledAncestor, getParticipantsPaneOpen } from '../functions';
import theme from '../theme.json';

import { FooterContextMenu } from './FooterContextMenu';
import { LobbyParticipantList } from './LobbyParticipantList';
import { MeetingParticipantList } from './MeetingParticipantList';
import {
    AntiCollapse,
    Close,
    Container,
    Footer,
    FooterButton,
    FooterEllipsisButton,
    FooterEllipsisContainer,
    Header
} from './styled';

export const ParticipantsPane = () => {
    const dispatch = useDispatch();
    const paneOpen = useSelector(getParticipantsPaneOpen);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const participantsCount = useSelector(getParticipantCount);
    const everyoneModerator = useSelector(isEveryoneModerator);
    const showContextMenu = !everyoneModerator && participantsCount > 2;

    const [ contextOpen, setContextOpen ] = useState(false);
    const { t } = useTranslation();

    const closePane = useCallback(() => dispatch(close(), [ dispatch ]));
    const closePaneKeyPress = useCallback(e => {
        if (closePane && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            closePane();
        }
    }, [ closePane ]);
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)), [ dispatch ]);

    useEffect(() => {
        const handler = [ 'click', e => {
            if (!findStyledAncestor(e.target, FooterEllipsisContainer)) {
                setContextOpen(false);
            }
        } ];

        window.addEventListener(...handler);

        return () => window.removeEventListener(...handler);
    }, [ contextOpen ]);

    const toggleContext = useCallback(() => setContextOpen(!contextOpen), [ contextOpen, setContextOpen ]);

    return (
        <ThemeProvider theme = { theme }>
            <div className = { classList('participants_pane', !paneOpen && 'participants_pane--closed') }>
                <div className = 'participants_pane-content'>
                    <Header>
                        <Close
                            aria-label = { t('participantsPane.close', 'Close') }
                            onClick = { closePane }
                            onKeyPress = { closePaneKeyPress }
                            role = 'button'
                            tabIndex = { 0 } />
                    </Header>
                    <Container>
                        <LobbyParticipantList />
                        <AntiCollapse />
                        <MeetingParticipantList />
                    </Container>
                    {isLocalModerator && (
                        <Footer>
                            <FooterButton onClick = { muteAll }>
                                {t('participantsPane.actions.muteAll')}
                            </FooterButton>
                            {showContextMenu && (
                                <FooterEllipsisContainer>
                                    <FooterEllipsisButton
                                        id = 'participants-pane-context-menu'
                                        onClick = { toggleContext } />
                                    {contextOpen && <FooterContextMenu onMouseLeave = { toggleContext } />}
                                </FooterEllipsisContainer>
                            )}
                        </Footer>
                    )}
                </div>
            </div>
        </ThemeProvider>
    );
};
