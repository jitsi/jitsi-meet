// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { openDialog } from '../../base/dialog';
import { isLocalParticipantModerator } from '../../base/participants';
import { createBreakoutRoom } from '../../breakout-rooms/actions';
import { RoomList } from '../../breakout-rooms/components/web';
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
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)), [ dispatch ]);
    const addRoom = useCallback(() => dispatch(createBreakoutRoom()), [ dispatch ]);

    return (
        <ThemeProvider theme = { theme }>
            <div
                className = { classList(
          'participants_pane',
          !paneOpen && 'participants_pane--closed'
                ) }>
                <div className = 'participants_pane-content'>
                    <Header>
                        <Close onClick = { closePane } />
                    </Header>
                    <Container>
                        <LobbyParticipantList />
                        <AntiCollapse />
                        <MeetingParticipantList />
                        <RoomList />
                    </Container>
                    {isLocalModerator && (
                        <Footer>
                            <FooterButton onClick = { addRoom }>
                                {t('breakoutRooms.actions.addRoom')}
                            </FooterButton>
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
