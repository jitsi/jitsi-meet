import React from 'react';
import type { Node } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { Avatar } from '../../../base/avatar';
import { applyEllipsis } from '../../../base/participants';
import { AudioStateIcons, MEDIA_STATE, type MediaState, VideoStateIcons } from '../../constants';

import { RaisedHandIndicator } from './RaisedHandIndicator';
import styles from './styles';


type Props = {

    /**
     * Media state for audio.
     */
    audioMediaState?: MediaState,

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
     * Is participant name inside a notification?
     */
    isDisplayNameInsideANotification: boolean,

    /**
     * Is the participant waiting?
     */
    isKnockingParticipant: boolean,

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
    raisedHand?: boolean,

    /**
     * Media state for video.
     */
    videoMediaState?: MediaState
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
    isDisplayNameInsideANotification = false,
    isKnockingParticipant = false,
    isModerator,
    local,
    onPress,
    participantID,
    raisedHand,
    audioMediaState = MEDIA_STATE.NONE,
    videoMediaState = MEDIA_STATE.NONE
}: Props) {

    const { t } = useTranslation();
    const maxLimit = isDisplayNameInsideANotification ? 10 : 22;
    const displayNameEllipsis = applyEllipsis(displayName, maxLimit);

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
                            style = { styles.participantName }>
                            { displayNameEllipsis }
                            { local && ` (${t('chat.you')})` }
                        </Text>
                    </View>
                    { isModerator && !disableModeratorIndicator
                        && <Text style = { styles.moderatorLabel }>{ t('videothumbnail.moderator') }</Text>
                    }
                </View>
                {
                    !isKnockingParticipant
                    && <>
                        { raisedHand && <RaisedHandIndicator /> }
                        <View style = { styles.participantStatesContainer }>
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
