// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { isToolbarButtonEnabled } from '../../../base/config';
import { hideDialog, openDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconCloseCircle, IconMessage,
    IconMicrophoneEmptySlash,
    IconMuteEveryoneElse, IconVideoOff
} from '../../../base/icons';
import {
    getParticipantByIdOrUndefined, getParticipantDisplayName,
    isLocalParticipantModerator
} from '../../../base/participants/functions';
import { connect } from '../../../base/redux';
import {
    isParticipantAudioMuted,
    isParticipantVideoMuted
} from '../../../base/tracks/functions';
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
     * The display name of the participant.
     */
    _displayName: string,

    /**
     * True if the local participant is moderator and false otherwise.
     */
    _isLocalModerator: boolean,

    /**
     * True if the chat button is enabled and false otherwise.
     */
    _isChatButtonEnabled: boolean,

    /**
     * True if the participant is moderator and false otherwise.
     */
    _isParticipantModerator: boolean,

    /**
     * True if the participant is video muted and false otherwise.
     */
    _isParticipantVideoMuted: boolean,

    /**
     * True if the participant is audio muted and false otherwise.
     */
    _isParticipantAudioMuted: boolean,

    /**
     * Participant reference
     */
    _participant: Object,

    /**
     * The ID of the participant.
     */
    participantID: string,
};

export const ContextMenuMeetingParticipantDetails = (
        {
            _displayName,
            _isLocalModerator,
            _isChatButtonEnabled,
            _isParticipantVideoMuted,
            _isParticipantAudioMuted,
            _participant,
            participantID
        }: Props) => {
    const dispatch = useDispatch();
    const cancel = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const kickRemoteParticipant = useCallback(() => {
        dispatch(openDialog(KickRemoteParticipantDialog, {
            participantID
        }));
    }, [ dispatch, participantID ]);
    const muteAudio = useCallback(() => {
        dispatch(openDialog(MuteRemoteParticipantDialog, {
            participantID
        }));
    }, [ dispatch, participantID ]);
    const muteEveryoneElse = useCallback(() => {
        dispatch(openDialog(MuteEveryoneDialog, {
            exclude: [ participantID ]
        }));
    }, [ dispatch, participantID ]);
    const muteVideo = useCallback(() => {
        dispatch(openDialog(MuteRemoteParticipantsVideoDialog, {
            participantID
        }));
    }, [ dispatch, participantID ]);

    const sendPrivateMessage = useCallback(() => {
        dispatch(hideDialog());
        dispatch(openChat(_participant));
    }, [ dispatch, _participant ]);
    const { t } = useTranslation();

    return (
        <BottomSheet
            addScrollViewPadding = { false }
            onCancel = { cancel }
            style = { styles.contextMenuMeetingParticipantDetails }>
            <View
                style = { styles.contextMenuItemSectionAvatar }>
                <Avatar
                    className = 'participant-avatar'
                    participantId = { participantID }
                    size = { 20 } />
                <View style = { styles.contextMenuItemAvatarText }>
                    <Text style = { styles.contextMenuItemName }>
                        { _displayName }
                    </Text>
                </View>
            </View>
            <Divider style = { styles.divider } />
            {
                _isLocalModerator && (
                    <>
                        {
                            !_isParticipantAudioMuted
                            && <TouchableOpacity
                                onPress = { muteAudio }
                                style = { styles.contextMenuItem }>
                                <Icon
                                    size = { 20 }
                                    src = { IconMicrophoneEmptySlash } />
                                <Text style = { styles.contextMenuItemText }>
                                    { t('participantsPane.actions.mute') }
                                </Text>
                            </TouchableOpacity>
                        }

                        <TouchableOpacity
                            onPress = { muteEveryoneElse }
                            style = { styles.contextMenuItem }>
                            <Icon
                                size = { 20 }
                                src = { IconMuteEveryoneElse } />
                            <Text style = { styles.contextMenuItemText }>
                                { t('participantsPane.actions.muteEveryoneElse') }
                            </Text>
                        </TouchableOpacity>
                    </>
                )
            }
            <Divider style = { styles.divider } />
            {
                _isLocalModerator && (
                    <>
                        {
                            _isParticipantVideoMuted
                            || <TouchableOpacity
                                onPress = { muteVideo }
                                style = { styles.contextMenuItemSection }>
                                <Icon
                                    size = { 20 }
                                    src = { IconVideoOff } />
                                <Text style = { styles.contextMenuItemText }>
                                    { t('participantsPane.actions.stopVideo') }
                                </Text>
                            </TouchableOpacity>
                        }

                        <TouchableOpacity
                            onPress = { kickRemoteParticipant }
                            style = { styles.contextMenuItem }>
                            <Icon
                                size = { 20 }
                                src = { IconCloseCircle } />
                            <Text style = { styles.contextMenuItemText }>
                                { t('videothumbnail.kick') }
                            </Text>
                        </TouchableOpacity>
                    </>
                )
            }
            {
                _isChatButtonEnabled && (
                    <TouchableOpacity
                        onPress = { sendPrivateMessage }
                        style = { styles.contextMenuItem }>
                        <Icon
                            size = { 20 }
                            src = { IconMessage } />
                        <Text style = { styles.contextMenuItemText }>
                            { t('toolbar.accessibilityLabel.privateMessage') }
                        </Text>
                    </TouchableOpacity>
                )
            }
            {/* We need design specs for this*/}
            {/* <TouchableOpacity*/}
            {/*    style = { styles.contextMenuItemSection }>*/}
            {/*    <Icon*/}
            {/*        size = { 20 }*/}
            {/*        src = { IconConnectionActive }*/}
            {/*        style = { styles.contextMenuItemIcon } />*/}
            {/*    <Text style = { styles.contextMenuItemText }>{ t('participantsPane.actions.networkStats') }</Text>*/}
            {/* </TouchableOpacity>*/}
            <Divider style = { styles.divider } />
            <VolumeSlider participant = { _participant } />
        </BottomSheet>
    );
};


/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): Object {
    const { participantID } = ownProps;
    const participant = getParticipantByIdOrUndefined(state, participantID);
    const _isLocalModerator = isLocalParticipantModerator(state);
    const _isChatButtonEnabled = isToolbarButtonEnabled('chat', state);
    const _isParticipantVideoMuted = isParticipantVideoMuted(participant, state);
    const _isParticipantAudioMuted = isParticipantAudioMuted(participant, state);

    return {
        _displayName: getParticipantDisplayName(state, participantID),
        _isLocalModerator,
        _isChatButtonEnabled,
        _isParticipantAudioMuted,
        _isParticipantVideoMuted,
        _participant: participant
    };
}

export default connect(_mapStateToProps)(ContextMenuMeetingParticipantDetails);
