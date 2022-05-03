import { TypedNavigator, useIsFocused } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { Chat, ChatAndPolls } from '../../../chat';
import { SharedDocument } from '../../../etherpad';
import { GifsMenu } from '../../../gifs/components';
import AddPeopleDialog
    from '../../../invite/components/add-people-dialog/native/AddPeopleDialog';
import LobbyNavigationContainer
    from '../../../mobile/navigation/components/lobby/components/LobbyNavigationContainer';
import { screen } from '../../../mobile/navigation/routes';
import {
    chatScreenOptions,
    conferenceScreenOptions,
    gifsMenuOptions,
    inviteScreenOptions,
    liveStreamScreenOptions,
    participantsScreenOptions,
    recordingScreenOptions,
    salesforceScreenOptions,
    securityScreenOptions,
    sharedDocumentScreenOptions,
    speakerStatsScreenOptions
} from '../../../mobile/navigation/screenOptions';
import { ParticipantsPane } from '../../../participants-pane/components/native';
import { StartLiveStreamDialog } from '../../../recording';
import { StartRecordingDialog }
    from '../../../recording/components/Recording/native';
import SalesforceLinkDialog
    from '../../../salesforce/components/native/SalesforceLinkDialog';
import SecurityDialog
    from '../../../security/components/security-dialog/native/SecurityDialog';
import SpeakerStats
    from '../../../speaker-stats/components/native/SpeakerStats';
import { setIsCarmode } from '../../../video-layout/actions';
import { getDisablePolls } from '../../functions';

import Conference from './Conference';

const ConferenceStack : TypedNavigator = createStackNavigator();

type Props = {

    /**
     * Callback on component focused.
     * Passes the route name to the embedder.
     */
    onFocused: Function

}

/**
 * The main conference screen navigator.
 *
 * @param {Props} props - The React props passed to this component.
 * @returns {JSX.Element} - The conference tab.
 */
const ConferenceTab = ({ onFocused }: Props) : JSX.Element => {
    const isFocused = useIsFocused();
    const dispatch = useDispatch();
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

    useEffect(() => {
        if (isFocused) {
            dispatch(setIsCarmode(false));
            onFocused(screen.conference.container);
        }
    }, [ isFocused ]);

    return (
        <ConferenceStack.Navigator
            initialRouteName = { screen.conference.main }
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
    );
};

export default ConferenceTab;
