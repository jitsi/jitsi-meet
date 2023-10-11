/* eslint-disable lines-around-comment */

import { NavigationContainer, Theme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import BreakoutRooms
// @ts-ignore
    from '../../../../../breakout-rooms/components/native/BreakoutRooms';
// @ts-ignore
import Chat from '../../../../../chat/components/native/Chat';
// @ts-ignore
import Conference from '../../../../../conference/components/native/Conference';
// @ts-ignore
import CarMode from '../../../../../conference/components/native/carmode/CarMode';
// @ts-ignore
import { getDisablePolls } from '../../../../../conference/functions';
// @ts-ignore
import SharedDocument from '../../../../../etherpad/components/native/SharedDocument';
// @ts-ignore
import GifsMenu from '../../../../../gifs/components/native/GifsMenu';
import AddPeopleDialog
// @ts-ignore
    from '../../../../../invite/components/add-people-dialog/native/AddPeopleDialog';
// @ts-ignore
import ParticipantsPane from '../../../../../participants-pane/components/native/ParticipantsPane';
// @ts-ignore
import StartLiveStreamDialog from '../../../../../recording/components/LiveStream/native/StartLiveStreamDialog';
import StartRecordingDialog
// @ts-ignore
    from '../../../../../recording/components/Recording/native/StartRecordingDialog';
import SalesforceLinkDialog
// @ts-ignore
    from '../../../../../salesforce/components/native/SalesforceLinkDialog';
import SecurityDialog
// @ts-ignore
    from '../../../../../security/components/security-dialog/native/SecurityDialog';
import SpeakerStats
// @ts-ignore
    from '../../../../../speaker-stats/components/native/SpeakerStats';
import LanguageSelectorDialog
// @ts-ignore
    from '../../../../../subtitles/components/native/LanguageSelectorDialog';
// @ts-ignore
import { screen } from '../../../routes';
import {
    breakoutRoomsScreenOptions,
    carmodeScreenOptions,
    chatScreenOptions,
    conferenceScreenOptions,
    gifsMenuOptions,
    inviteScreenOptions,
    liveStreamScreenOptions,
    lobbyNavigationContainerScreenOptions,
    navigationContainerTheme,
    participantsScreenOptions,
    recordingScreenOptions,
    salesforceScreenOptions,
    securityScreenOptions,
    settingsNavigationContainerScreenOptions,
    sharedDocumentScreenOptions,
    speakerStatsScreenOptions,
    subtitlesScreenOptions
    // @ts-ignore
} from '../../../screenOptions';
// @ts-ignore
import ChatAndPollsNavigator from '../../chat/components/ChatAndPollsNavigator';
// @ts-ignore
import LobbyNavigationContainer from '../../lobby/components/LobbyNavigationContainer';
// @ts-ignore
import SettingsNavigationContainer from '../../settings/components/SettingsNavigationContainer';
import {
    conferenceNavigationRef
    // @ts-ignore
} from '../ConferenceNavigationContainerRef';


const ConferenceStack = createStackNavigator();


const ConferenceNavigationContainer = () => {
    const isPollsDisabled = useSelector(getDisablePolls);
    let ChatScreen;
    let chatScreenName;
    let chatTitleString;

    if (isPollsDisabled) {
        ChatScreen = Chat;
        chatScreenName = screen.conference.chat;
        chatTitleString = 'chat.title';
    } else {
        ChatScreen = ChatAndPollsNavigator;
        chatScreenName = screen.conference.chatandpolls.main;
        chatTitleString = 'chat.titleWithPolls';
    }
    const { t } = useTranslation();

    return (
        <NavigationContainer
            independent = { true }
            ref = { conferenceNavigationRef }
            theme = { navigationContainerTheme as Theme }>
            <ConferenceStack.Navigator
                screenOptions = {{
                    presentation: 'modal'
                }}>
                <ConferenceStack.Screen
                    component = { Conference }
                    name = { screen.conference.main }
                    options = { conferenceScreenOptions } />
                <ConferenceStack.Screen
                    component = { ChatScreen }
                    name = { chatScreenName }
                    options = {{
                        ...chatScreenOptions,
                        title: t(chatTitleString)
                    }} />
                <ConferenceStack.Screen
                    component = { ParticipantsPane }
                    name = { screen.conference.participants }
                    options = {{
                        ...participantsScreenOptions,
                        title: t('participantsPane.title')
                    }} />
                <ConferenceStack.Screen
                    component = { SecurityDialog }
                    name = { screen.conference.security }
                    options = {{
                        ...securityScreenOptions,
                        title: t('security.title')
                    }} />
                <ConferenceStack.Screen
                    component = { StartRecordingDialog }
                    name = { screen.conference.recording }
                    options = {{
                        ...recordingScreenOptions,
                        title: t('recording.title')
                    }} />
                <ConferenceStack.Screen
                    component = { StartLiveStreamDialog }
                    name = { screen.conference.liveStream }
                    options = {{
                        ...liveStreamScreenOptions,
                        title: t('liveStreaming.title')
                    }} />
                <ConferenceStack.Screen
                    component = { SpeakerStats }
                    name = { screen.conference.speakerStats }
                    options = {{
                        ...speakerStatsScreenOptions,
                        title: t('speakerStats.speakerStats')
                    }} />
                <ConferenceStack.Screen
                    component = { SalesforceLinkDialog }
                    name = { screen.conference.salesforce }
                    options = {{
                        ...salesforceScreenOptions,
                        title: t('notify.linkToSalesforce')
                    }} />
                <ConferenceStack.Screen
                    component = { GifsMenu }
                    name = { screen.conference.gifsMenu }
                    options = {{
                        ...gifsMenuOptions,
                        title: t('notify.gifsMenu')
                    }} />
                <ConferenceStack.Screen
                    component = { LobbyNavigationContainer }
                    name = { screen.lobby.root }
                    options = {{
                        ...lobbyNavigationContainerScreenOptions,
                        title: t('lobby.title')
                    }} />
                <ConferenceStack.Screen
                    component = { AddPeopleDialog }
                    name = { screen.conference.invite }
                    options = {{
                        ...inviteScreenOptions,
                        title: t('addPeople.add')
                    }} />
                <ConferenceStack.Screen
                    component = { SharedDocument }
                    name = { screen.conference.sharedDocument }
                    options = {{
                        ...sharedDocumentScreenOptions,
                        title: t('documentSharing.title')
                    }} />
                <ConferenceStack.Screen
                    // @ts-ignore
                    component = { SettingsNavigationContainer }
                    name = { screen.settings.main }
                    options = { settingsNavigationContainerScreenOptions } />
                <ConferenceStack.Screen
                    // @ts-ignore
                    component = { CarMode }
                    name = { screen.conference.carmode }
                    options = {{
                        ...carmodeScreenOptions,
                        title: t('carmode.labels.title')
                    }} />
                <ConferenceStack.Screen
                    component = { LanguageSelectorDialog }
                    name = { screen.conference.subtitles }
                    options = {{
                        ...subtitlesScreenOptions,
                        title: t('transcribing.subtitles')
                    }} />
                <ConferenceStack.Screen
                    component = { BreakoutRooms }
                    name = { screen.conference.breakoutRooms }
                    options = {{
                        ...breakoutRoomsScreenOptions,
                        title: t('breakoutRooms.title')
                    }} />
            </ConferenceStack.Navigator>
        </NavigationContainer>
    );
};

export default ConferenceNavigationContainer;
