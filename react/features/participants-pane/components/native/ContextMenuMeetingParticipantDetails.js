// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { Avatar } from '../../../base/avatar';
import { hideDialog, openDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconCloseCircle, IconMessage,
    IconMicrophoneEmptySlash,
    IconMuteEveryoneElse, IconVideoOff
} from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    getParticipantDisplayName, getRemoteParticipants,
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
    MuteRemoteParticipantsVideoDialog
} from '../../../video-menu';
import VolumeSlider from '../../../video-menu/components/native/VolumeSlider';

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
     * Whether the participant is present in the room or not.
     */
    _isParticipantIDAvailable?: boolean,

    /**
     * Participant reference
     */
    _participant: Object,

    /**
     * The ID of the participant.
     */
    participantID: string,
};

const ContextMenuMeetingParticipantDetails = (
        {
            _displayName,
            _isLocalModerator,
            _isParticipantVideoMuted,
            _isParticipantAudioMuted,
            _participant,
            _isParticipantIDAvailable,
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
            showSlidingView = { _isParticipantIDAvailable }
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
                            !_isParticipantVideoMuted
                            && <TouchableOpacity
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
            <VolumeSlider participantID = { participantID } />
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
    const participantIDS = [];

    const participant = getParticipantByIdOrUndefined(state, participantID);
    const _isLocalModerator = isLocalParticipantModerator(state);
    const _isParticipantVideoMuted = isParticipantVideoMuted(participant, state);
    const _isParticipantAudioMuted = isParticipantAudioMuted(participant, state);
    const localParticipant = getLocalParticipant(state);
    const remoteParticipants = getRemoteParticipants(state);

    localParticipant && participantIDS.push(localParticipant?.id);

    remoteParticipants.forEach(p => {
        participantIDS.push(p?.id);
    });

    const isParticipantIDAvailable = participantIDS.find(partID => partID === participantID);

    return {
        _displayName: getParticipantDisplayName(state, participantID),
        _isLocalModerator,
        _isParticipantAudioMuted,
        _isParticipantIDAvailable: Boolean(isParticipantIDAvailable),
        _isParticipantVideoMuted,
        _participant: participant
    };
}

export default connect(_mapStateToProps)(ContextMenuMeetingParticipantDetails);
