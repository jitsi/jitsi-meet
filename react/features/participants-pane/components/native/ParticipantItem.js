import React from 'react';
import type { Node } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Avatar } from '../../../base/avatar';

import styles from './styles';

type Props = {

    /**
     * React children.
     */
    children?: Node,

    /**
     * Whether or not to disable the moderator indicator.
     */
    disableModeratorIndicator?: boolean,

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName: string,

    /**
     * Whether or not the user is a moderator.
     */
    isModerator?: boolean,

    /**
     * True if the participant is local.
     */
    local?: boolean,

    /**
     * Callback to be invoked on pressing the participant item.
     */
    onPress?: Function,

    /**
     * The ID of the participant.
     */
    participantID: string,

    /**
     * True if the participant have raised hand.
     */
    raisedHand?: boolean
}

/**
 * Participant item.
 *
 * @returns {React$Element<any>}
 */
function ParticipantItem({
    children,
    displayName,
    disableModeratorIndicator,
    isModerator,
    local,
    onPress,
    participantID,
    raisedHand
}: Props) {

    const { t } = useTranslation();

    return (
        <View style = { styles.participantContainer } >
            <TouchableOpacity
                onPress = { onPress }
                style = { styles.participantContent }>
                <Avatar
                    className = 'participant-avatar'
                    displayName = { displayName }
                    participantId = { participantID }
                    size = { 32 } />
                <View
                    style = { [
                        styles.participantDetailsContainer,
                        raisedHand && styles.participantDetailsContainerRaisedHand
                    ] }>
                    <View style = { styles.participantNameContainer }>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.participantName }>
                            { displayName }
                            { local && ` (${t('chat.you')})` }
                        </Text>
                    </View>
                    {
                        isModerator && !disableModeratorIndicator
                        && <Text style = { styles.moderatorLabel }>{t('videothumbnail.moderator')}</Text>
                    }
                </View>
            </TouchableOpacity>
            { !local && children }
        </View>
    );
}

export default ParticipantItem;
