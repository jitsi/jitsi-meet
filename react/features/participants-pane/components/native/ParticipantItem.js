// @flow

import React from 'react';
import type { Node } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { getParticipantDisplayNameWithId } from '../../../base/participants';
import {
    AudioStateIcons,
    MediaState,
    VideoStateIcons
} from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import styles from './styles';

type Props = {

    /**
     * Media state for audio
     */
    audioMuteState: MediaState,

    /**
     * React children
     */
    children?: Node,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    name?: string,

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
    children,
    name,
    participant: p,
    videoMuteState = MediaState.None
}: Props) {
    const displayName = name || useSelector(getParticipantDisplayNameWithId(p.id));
    const { t } = useTranslation();

    return (
        <View style = { styles.participantContainer } >
            <Avatar
                className = 'participant-avatar'
                participantId = { p.id }
                size = { 32 } />
            <View style = { styles.participantContent }>
                <View style = { styles.participantNameContainer }>
                    <Text style = { styles.participantName }>
                        { displayName }
                    </Text>
                    { p.local ? <Text style = { styles.isLocal }>({t('chat.you')})</Text> : null }
                </View>
                <View style = { styles.participantStatesContainer } >
                    {p.raisedHand && <RaisedHandIndicator />}
                    <View style = { styles.participantStateVideo }>{VideoStateIcons[videoMuteState]}</View>
                    <View style = { styles.participantStateAudio }>{AudioStateIcons[audioMuteState]}</View>
                </View>
            </View>
            { children }
        </View>
    );
}

export default ParticipantItem;
