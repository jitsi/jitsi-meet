import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSelector } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { isLocalParticipantModerator } from '../../../base/participants/functions';

import LobbyParticipantList from './LobbyParticipantList';
import MeetingParticipantList from './MeetingParticipantList';
import ParticipantsPaneFooter from './ParticipantsPaneFooter';
import styles from './styles';


/**
 * Participants pane.
 *
 * @returns {React$Element<any>}
 */
const ParticipantsPane = () => {
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const [ searchString, setSearchString ] = useState('');

    return (
        <JitsiScreen
            footerComponent = { isLocalModerator ? ParticipantsPaneFooter : undefined }
            style = { styles.participantsPaneContainer }>
            <ScrollView>
                <LobbyParticipantList />
                <MeetingParticipantList
                    searchString = { searchString }
                    setSearchString = { setSearchString } />
            </ScrollView>
        </JitsiScreen>
    );
};

export default ParticipantsPane;
