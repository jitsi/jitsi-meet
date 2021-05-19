// @flow

import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { getParticipantDisplayNameWithId } from '../../../base/participants';
import { ActionTrigger, MediaState } from '../../constants';
// import { AudioStateIcons, VideoStateIcons } from '../web/ParticipantItem';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import styles from './styles';

type Props = {

    /**
     * Type of trigger for the participant actions
     */
    actionsTrigger: ActionTrigger,

    /**
     * Media state for audio
     */
    audioMuteState: MediaState,

    /**
     * Callback for when the mouse leaves this component
     */
    onLeave?: Function,

    /**
     * Participant reference
     */
    participant: Object,

    /**
     * Media state for video
     */
    videoMuteState: MediaState
}

/**
 * Participant item.
 *
 * @returns {React$Element<any>}
 */
function ParticipantItem({
    audioMuteState = MediaState.None,
    videoMuteState = MediaState.None,
    participant: p
}: Props) {
    const { t } = useTranslation();
    const name = useSelector(getParticipantDisplayNameWithId(p.id));

    return (
        <View style = { styles.participantContainer } >
            <Avatar
                className = 'participant-avatar'
                participant = { p.id }
                size = { 32 } />
            <View style = { styles.participantContent }>
                <View style = { styles.participantNameContainer }>
                    <Text style = { styles.participantName }>
                        { name }
                    </Text>
                    { p.local ? <Text>({t('chat.you')})</Text> : null }
                </View>
                <View style = { styles.participantStates } >
                    {p.raisedHand && <RaisedHandIndicator />}
                    {VideoStateIcons[videoMuteState]}
                    {AudioStateIcons[audioMuteState]}
                </View>
            </View>
        </View>
    );
}

export default ParticipantItem;
