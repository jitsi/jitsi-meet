// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { isToolbarButtonEnabled } from '../../../base/config';
import { hideDialog, openDialog } from '../../../base/dialog';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconCloseCircle, IconConnectionActive, IconMessage,
    IconMicrophoneEmptySlash,
    IconMuteEveryoneElse, IconVideoOff
} from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { getIsParticipantVideoMuted } from '../../../base/tracks';
import { openChat } from '../../../chat/actions.native';
import {
    KickRemoteParticipantDialog,
    MuteEveryoneDialog,
    MuteRemoteParticipantDialog,
    MuteRemoteParticipantsVideoDialog,
    VolumeSlider
} from '../../../video-menu';

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
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const isChatButtonEnabled = useSelector(isToolbarButtonEnabled('chat'));
    const isParticipantVideoMuted = useSelector(getIsParticipantVideoMuted(p));
    const kickRemoteParticipant = useCallback(() => {
        dispatch(openDialog(KickRemoteParticipantDialog, {
            participantID: p.id
        }));
    }, [ dispatch, p ]);
    const muteAudio = useCallback(() => {
        dispatch(openDialog(MuteRemoteParticipantDialog, {
            participantID: p.id
        }));
    }, [ dispatch, p ]);
    const muteEveryoneElse = useCallback(() => {
        dispatch(openDialog(MuteEveryoneDialog, {
            exclude: [ p.id ]
        }));
    }, [ dispatch, p ]);
    const muteVideo = useCallback(() => {
        dispatch(openDialog(MuteRemoteParticipantsVideoDialog, {
            participantID: p.id
        }));
    }, [ dispatch, p ]);
    const sendPrivateMessage = useCallback(() => {
        dispatch(openChat(p));
    }, [ dispatch, p ]);
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
                    size = { 24 } />
                <View style = { styles.contextMenuItemText }>
                    <Text style = { styles.contextMenuItemName }>
                        { displayName }
                    </Text>
                </View>
            </View>
            {
                isLocalModerator
                && <TouchableOpacity
                    onPress = { muteAudio }
                    style = { styles.contextMenuItem }>
                    <Icon
                        size = { 24 }
                        src = { IconMicrophoneEmptySlash }
                        style = { styles.contextMenuItemIcon } />
                    <Text style = { styles.contextMenuItemText }>
                        { t('participantsPane.actions.mute') }
                    </Text>
                </TouchableOpacity>
            }
            {
                isLocalModerator
                && <TouchableOpacity
                    onPress = { muteEveryoneElse }
                    style = { styles.contextMenuItem }>
                    <Icon
                        size = { 24 }
                        src = { IconMuteEveryoneElse }
                        style = { styles.contextMenuItemIcon } />
                    <Text style = { styles.contextMenuItemText }>
                        { t('participantsPane.actions.muteEveryoneElse') }
                    </Text>
                </TouchableOpacity>
            }
            {
                isLocalModerator && (
                    isParticipantVideoMuted
                    || <TouchableOpacity
                        onPress = { muteVideo }
                        style = { styles.contextMenuItemSection }>
                        <Icon
                            size = { 24 }
                            src = { IconVideoOff }
                            style = { styles.contextMenuItemIcon } />
                        <Text style = { styles.contextMenuItemText }>
                            { t('participantsPane.actions.stopVideo') }
                        </Text>
                    </TouchableOpacity>
                )
            }
            {
                isLocalModerator
                && <TouchableOpacity
                    onPress = { kickRemoteParticipant }
                    style = { styles.contextMenuItem }>
                    <Icon
                        size = { 24 }
                        src = { IconCloseCircle }
                        style = { styles.contextMenuItemIcon } />
                    <Text style = { styles.contextMenuItemText }>
                        { t('videothumbnail.kick') }
                    </Text>
                </TouchableOpacity>
            }
            {
                isChatButtonEnabled
                && <TouchableOpacity
                    onPress = { sendPrivateMessage }
                    style = { styles.contextMenuItem }>
                    <Icon
                        size = { 24 }
                        src = { IconMessage }
                        style = { styles.contextMenuItemIcon } />
                    <Text style = { styles.contextMenuItemText }>
                        { t('toolbar.accessibilityLabel.privateMessage') }
                    </Text>
                </TouchableOpacity>
            }
            <TouchableOpacity
                style = { styles.contextMenuItemSection }>
                <Icon
                    size = { 24 }
                    src = { IconConnectionActive }
                    style = { styles.contextMenuItemIcon } />
                <Text style = { styles.contextMenuItemText }>{ t('participantsPane.actions.networkStats') }</Text>
            </TouchableOpacity>
            <VolumeSlider />
        </BottomSheet>
    );
};
