/* eslint-disable lines-around-comment */
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

// @ts-ignore
import { Chat, ChatAndPolls } from '../../../../../chat';
// @ts-ignore
import Conference from '../../../../../conference/components/native/Conference';
import CarMode from '../../../../../conference/components/native/carmode/CarMode';
// @ts-ignore
import { getDisablePolls } from '../../../../../conference/functions';
// @ts-ignore
import { SharedDocument } from '../../../../../etherpad';
// @ts-ignore
import { GifsMenu } from '../../../../../gifs/components';
import AddPeopleDialog
// @ts-ignore
    from '../../../../../invite/components/add-people-dialog/native/AddPeopleDialog';
// @ts-ignore
import { ParticipantsPane } from '../../../../../participants-pane/components/native';
// @ts-ignore
import { StartLiveStreamDialog } from '../../../../../recording';
import { StartRecordingDialog }
// @ts-ignore
    from '../../../../../recording/components/Recording/native';
import SalesforceLinkDialog
// @ts-ignore
    from '../../../../../salesforce/components/native/SalesforceLinkDialog';
import SecurityDialog
// @ts-ignore
    from '../../../../../security/components/security-dialog/native/SecurityDialog';
import SpeakerStats
// @ts-ignore
    from '../../../../../speaker-stats/components/native/SpeakerStats';
// @ts-ignore
import { screen } from '../../../routes';
import {
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
    sharedDocumentScreenOptions,
    speakerStatsScreenOptions
    // @ts-ignore
} from '../../../screenOptions';
import LobbyNavigationContainer
// @ts-ignore
    from '../../lobby/components/LobbyNavigationContainer';
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
        ChatScreen = ChatAndPolls;
        chatScreenName = screen.conference.chatandpolls.main;
        chatTitleString = 'chat.titleWithPolls';
    }
    const { t } = useTranslation();

    return (
        <NavigationContainer
            independent = { true }
            ref = { conferenceNavigationRef }
            theme = { navigationContainerTheme }>
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
                        title: t('participantsPane.header')
                    }} />
                <ConferenceStack.Screen
                    component = { SecurityDialog }
                    name = { screen.conference.security }
                    options = {{
                        ...securityScreenOptions,
                        title: t('security.header')
                    }} />
                <ConferenceStack.Screen
                    component = { StartRecordingDialog }
                    name = { screen.conference.recording }
                    options = { recordingScreenOptions } />
                <ConferenceStack.Screen
                    component = { StartLiveStreamDialog }
                    name = { screen.conference.liveStream }
                    options = { liveStreamScreenOptions } />
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
                    options = { lobbyNavigationContainerScreenOptions } />
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
                    component = { CarMode }
                    name = { screen.conference.carmode }
                    options = {{
                        ...carmodeScreenOptions,
                        title: t('carmode.labels.title')
                    }} />
            </ConferenceStack.Navigator>
        </NavigationContainer>
    );
};

export default ConferenceNavigationContainer;
