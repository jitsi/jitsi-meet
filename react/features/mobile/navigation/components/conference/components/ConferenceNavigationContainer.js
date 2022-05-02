import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Chat } from '../../../../../chat';
import Conference from '../../../../../conference/components/native/Conference';
import { getDisablePolls } from '../../../../../conference/functions';
import { SharedDocument } from '../../../../../etherpad';
import { GifsMenu } from '../../../../../gifs/components';
import AddPeopleDialog
    from '../../../../../invite/components/add-people-dialog/native/AddPeopleDialog';
import { ParticipantsPane } from '../../../../../participants-pane/components/native';
import { StartLiveStreamDialog } from '../../../../../recording';
import { StartRecordingDialog }
    from '../../../../../recording/components/Recording/native';
import SalesforceLinkDialog
    from '../../../../../salesforce/components/native/SalesforceLinkDialog';
import SecurityDialog
    from '../../../../../security/components/security-dialog/native/SecurityDialog';
import SpeakerStats
    from '../../../../../speaker-stats/components/native/SpeakerStats';
import { screen } from '../../../routes';
import {
    chatScreenOptions,
    conferenceScreenOptions,
    gifsMenuOptions,
    inviteScreenOptions,
    liveStreamScreenOptions,
    navigationContainerTheme,
    participantsScreenOptions,
    recordingScreenOptions,
    salesforceScreenOptions,
    securityScreenOptions,
    sharedDocumentScreenOptions,
    speakerStatsScreenOptions
} from '../../../screenOptions';
import ChatAndPollsNavigationContainer
    from '../../chat/components/ChatAndPollsNavigationContainer';
import LobbyNavigationContainer
    from '../../lobby/components/LobbyNavigationContainer';
import {
    conferenceNavigationRef
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
        ChatScreen = ChatAndPollsNavigationContainer;
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
                    options = {{
                        ...recordingScreenOptions
                    }} />
                <ConferenceStack.Screen
                    component = { StartLiveStreamDialog }
                    name = { screen.conference.liveStream }
                    options = {{
                        ...liveStreamScreenOptions
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
                        gestureEnabled: false,
                        headerShown: false
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
            </ConferenceStack.Navigator>
        </NavigationContainer>
    );
};

export default ConferenceNavigationContainer;
