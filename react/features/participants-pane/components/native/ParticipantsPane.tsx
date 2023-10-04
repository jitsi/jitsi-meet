import React, { useState } from 'react';
import { FlatList } from 'react-native';
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
    const [ searchString, setSearchString ] = useState('');
    const isLocalModerator = useSelector(isLocalParticipantModerator);

    return (
        <JitsiScreen
            footerComponent = { isLocalModerator ? ParticipantsPaneFooter : undefined }
            style = { styles.participantsPaneContainer }>
            <FlatList
                data = {[]}
                keyExtractor = { (_e, i) => 'dom' + i.toString() }
                ListEmptyComponent = { null }
                renderItem = { null }
                ListHeaderComponent = {() =>
                    <>
                        <LobbyParticipantList />
                        <MeetingParticipantList
                            searchString = { searchString }
                            setSearchString = { setSearchString } />
                    </>
                }
            />
        </JitsiScreen>
    );
};

export default ParticipantsPane;
