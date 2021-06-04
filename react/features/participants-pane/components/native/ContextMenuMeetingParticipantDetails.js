// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { hideDialog } from '../../../base/dialog';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconCloseCircle, IconConnectionActive, IconMessage,
    IconMicrophoneEmptySlash,
    IconMuteEveryoneElse, IconVideoOff
} from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { muteRemote } from '../../../video-menu/actions.any';

import styles from './styles';

type Props = {

    /**
     * Participant reference
     */
    participant: Object
};

export const ContextMenuMeetingParticipantDetails = ({ participant: p }: Props) => {
    const dispatch = useDispatch();
    const cancel = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const displayName = p.name;
    const muteAudio = useCallback(() => dispatch(muteRemote(p.id, MEDIA_TYPE.AUDIO)), [ dispatch ]);
    const { t } = useTranslation();

    return (
        <BottomSheet
            onCancel = { cancel }
            style = { styles.contextMenuMore }>
            <View
                style = { styles.contextMenuItemSection }>
                <Avatar
                    className = 'participant-avatar'
                    participantId = { p.id }
                    size = { 32 } />
                <View style = { styles.contextMenuItemText }>
                    <Text style = { styles.contextMenuItemName }>
                        { displayName }
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                onPress = { muteAudio }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconMicrophoneEmptySlash }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('participantsPane.actions.mute') }</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress = { muteAudio }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconMuteEveryoneElse }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('participantsPane.actions.muteEveryoneElse') }</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style = { styles.contextMenuItemSection }>
                <Icon
                    size = { 24 }
                    src = { IconVideoOff }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('participantsPane.actions.stopVideo') }</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconCloseCircle }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('videothumbnail.kick') }</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconMessage }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('toolbar.accessibilityLabel.privateMessage') }</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style = { styles.contextMenuItemSection }>
                <Icon
                    size = { 24 }
                    src = { IconConnectionActive }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('participantsPane.actions.networkStats') }</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};
