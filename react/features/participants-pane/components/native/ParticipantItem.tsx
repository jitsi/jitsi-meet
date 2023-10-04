import React from 'react';
import { useTranslation } from 'react-i18next';
import { GestureResponderEvent, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import Avatar from '../../../base/avatar/components/Avatar';
import { AudioStateIcons, MEDIA_STATE, type MediaState, VideoStateIcons } from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import styles from './styles';

interface IProps {

    /**
     * Media state for audio.
     */
    audioMediaState?: MediaState;

    /**
     * React children.
     */
    children?: React.ReactNode;

    /**
     * Whether or not to disable the moderator indicator.
     */
    disableModeratorIndicator?: boolean;

    /**
     * The name of the participant. Used for showing lobby names.
     */
    displayName: string;

    /**
     * Is the participant waiting?
     */
    isKnockingParticipant?: boolean;

    /**
     * Whether or not the user is a moderator.
     */
    isModerator?: boolean;

    /**
     * True if the participant is local.
     */
    local?: boolean;

    /**
     * Callback to be invoked on pressing the participant item.
     */
    onPress?: (e?: GestureResponderEvent) => void;

    /**
     * The ID of the participant.
     */
    participantID: string;

    /**
     * True if the participant have raised hand.
     */
    raisedHand?: boolean;

    /**
     * Media state for video.
     */
    videoMediaState?: MediaState;
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
    isKnockingParticipant = false,
    isModerator,
    local,
    onPress,
    participantID,
    raisedHand,
    audioMediaState = MEDIA_STATE.NONE,
    videoMediaState = MEDIA_STATE.NONE
}: IProps) {

    const { t } = useTranslation();
    const participantNameContainerStyles
        = isKnockingParticipant ? styles.lobbyParticipantNameContainer : styles.participantNameContainer;

    return (
        <View style = { styles.participantContainer as ViewStyle } >
            <TouchableOpacity
                onPress = { onPress }
                style = { styles.participantContent as ViewStyle }>
                <Avatar
                    displayName = { displayName }
                    participantId = { participantID }
                    size = { 32 } />
                <View
                    style = { [
                        styles.participantDetailsContainer,
                        raisedHand && styles.participantDetailsContainerRaisedHand
                    ] }>
                    <View style = { participantNameContainerStyles as ViewStyle }>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.participantName as TextStyle }>
                            { displayName }
                            { local && ` (${t('chat.you')})` }
                        </Text>
                    </View>
                    { isModerator && !disableModeratorIndicator
                        && <Text style = { styles.moderatorLabel as TextStyle }>{ t('videothumbnail.moderator') }</Text>
                    }
                </View>
                {
                    !isKnockingParticipant
                    && <>
                        { raisedHand && <RaisedHandIndicator /> }
                        <View style = { styles.participantStatesContainer as ViewStyle }>
                            <View style = { styles.participantStateVideo }>{ VideoStateIcons[videoMediaState] }</View>
                            <View>{ AudioStateIcons[audioMediaState] }</View>
                        </View>
                    </>
                }
            </TouchableOpacity>
            { !local && children }
        </View>
    );
}

export default ParticipantItem;
