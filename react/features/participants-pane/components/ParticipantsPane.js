// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { openDialog } from '../../base/dialog';
import { isLocalParticipantModerator } from '../../base/participants';
import { MuteEveryoneDialog } from '../../video-menu/components/';
import { close } from '../actions';
import { classList, getParticipantsPaneOpen } from '../functions';
import theme from '../theme.json';

import { LobbyParticipantList } from './LobbyParticipantList';
import { MeetingParticipantList } from './MeetingParticipantList';
import {
    AntiCollapse,
    Close,
    Container,
    Footer,
    FooterButton,
    Header
} from './styled';

export const ParticipantsPane = () => {
    const dispatch = useDispatch();
    const paneOpen = useSelector(getParticipantsPaneOpen);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const { t } = useTranslation();

    const closePane = useCallback(() => dispatch(close(), [ dispatch ]));
    const closePaneKeyPress = useCallback(e => {
        if (closePane && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            closePane();
        }
    }, [ closePane ]);
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)), [ dispatch ]);

    return (
        <ThemeProvider theme = { theme }>
            <div
                className = { classList(
          'participants_pane',
          !paneOpen && 'participants_pane--closed'
                ) }>
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
                        </Footer>
                    )}
                </div>
            </div>
        </ThemeProvider>
    );
};
