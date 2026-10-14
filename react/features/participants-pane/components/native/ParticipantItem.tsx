import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    GestureResponderEvent,
    StyleProp,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { Text } from 'react-native-paper';

import Avatar from '../../../base/avatar/components/Avatar';
import Icon from '../../../base/icons/components/Icon';
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

    const audioIconData = audioMediaState ? AudioStateIcons[audioMediaState] : null;
    const videoIconData = videoMediaState ? VideoStateIcons[videoMediaState] : null;

    const accessibleLabels = [
        displayName,
        local ? `(${t('chat.you')})` : '',
        isModerator && !disableModeratorIndicator ? t('videothumbnail.moderator') : '',
        raisedHand ? t('participantsPane.indicators.raisedHand') : '',
        videoIconData?.labelKey ? t(videoIconData.labelKey) : '',
        audioIconData?.labelKey ? t(audioIconData.labelKey) : ''
    ].filter(Boolean).join(', ');

    return (
        <View style = { styles.participantContainer as StyleProp<ViewStyle> } >
            <TouchableOpacity
                accessibilityLabel = { accessibleLabels }
                onPress = { onPress }
                style = { styles.participantContent as StyleProp<ViewStyle> }>
                <Avatar
                    displayName = { displayName }
                    participantId = { participantID }
                    size = { 32 } />
                <View>
                    <View style = { styles.participantNameContainer as StyleProp<ViewStyle> }>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.participantName as StyleProp<TextStyle> }>
                            { displayName }
                            { local && ` (${t('chat.you')})` }
                        </Text>
                    </View>
                    {
                        isModerator && !disableModeratorIndicator
                        && <Text style = { styles.moderatorLabel as StyleProp<TextStyle> }>
                            { t('videothumbnail.moderator') }
                        </Text>
                    }
                </View>
                {
                    !isKnockingParticipant
                    && <View style = { styles.participantStatesContainer as StyleProp<ViewStyle> }>
                        <View>{ raisedHand && <RaisedHandIndicator /> }</View>
                        <View style = { styles.participantStateVideo }>
                            { videoIconData && (
                                <Icon
                                    color = { videoIconData.color }
                                    size = { 16 }
                                    src = { videoIconData.src } />
                            ) }
                        </View>
                        <View>
                            { audioIconData && (
                                <Icon
                                    color = { audioIconData.color }
                                    size = { 16 }
                                    src = { audioIconData.src } />
                            ) }
                        </View>
                    </View>
                }
            </TouchableOpacity>
            { !local && children }
        </View>
    );
}

export default ParticipantItem;
