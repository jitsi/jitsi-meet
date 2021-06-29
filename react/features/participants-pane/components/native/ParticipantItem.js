// @flow

import React from 'react';
import type { Node } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { getParticipantDisplayNameWithId } from '../../../base/participants';
import { MEDIA_STATE, type MediaState, AudioStateIcons, VideoStateIcons } from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import styles from './styles';

type Props = {

    /**
     * Media state for audio
     */
    audioMediaState: MediaState,

    /**
     * React children
     */
    children?: Node,

    /**
     * Is the participant waiting?
     */
    isKnockingParticipant: boolean,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    name?: string,

    /**
     * Callback to be invoked on pressing the participant item.
     */
    onPress?: Function,

    /**
     * Participant reference
     */
    participant: Object,

    /**
     * Media state for video
     */
    videoMediaState: MediaState
}

/**
 * Participant item.
 *
 * @returns {React$Element<any>}
 */
function ParticipantItem({
    children,
    isKnockingParticipant,
    name,
    onPress,
    participant: p,
    audioMediaState = MEDIA_STATE.NONE,
    videoMediaState = MEDIA_STATE.NONE
}: Props) {

    const displayName = name || useSelector(getParticipantDisplayNameWithId(p.id));
    const { t } = useTranslation();

    return (
        <View style = { styles.participantContainer } >
            <TouchableOpacity
                onPress = { onPress }
                style = { styles.participantContent }>
                <Avatar
                    className = 'participant-avatar'
                    participantId = { p.id }
                    size = { 32 } />
                <View style = { styles.participantNameContainer }>
                    <Text style = { styles.participantName }>
                        { displayName }
                    </Text>
                    { p.local ? <Text style = { styles.isLocal }>({t('chat.you')})</Text> : null }
                </View>
                {
                    !isKnockingParticipant
                    && <>
                        {
                            p.raisedHand && <RaisedHandIndicator />
                        }
                        <View style = { styles.participantStatesContainer }>
                            <View style = { styles.participantStateVideo }>{VideoStateIcons[videoMediaState]}</View>
                            <View>{AudioStateIcons[audioMediaState]}</View>
                        </View>
                    </>
                }
            </TouchableOpacity>
            { !p.local && children }
        </View>
    );
}

export default ParticipantItem;
