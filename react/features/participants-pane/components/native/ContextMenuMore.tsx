import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import {
    requestDisableAudioModeration,
    requestDisableDesktopModeration,
    requestDisableVideoModeration,
    requestEnableAudioModeration,
    requestEnableDesktopModeration,
    requestEnableVideoModeration
} from '../../../av-moderation/actions';
import { MEDIA_TYPE } from '../../../av-moderation/constants';
import {
    isEnabled as isAvModerationEnabled,
    isSupported as isAvModerationSupported
} from '../../../av-moderation/functions';
import { getCurrentConference } from '../../../base/conference/functions';
import { hideSheet, openDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import Icon from '../../../base/icons/components/Icon';
import { IconCheck, IconRaiseHand, IconVideoOff } from '../../../base/icons/svg';
import { raiseHand } from '../../../base/participants/actions';
import { getRaiseHandsQueue, isLocalParticipantModerator } from '../../../base/participants/functions';
import { LOWER_HAND_MESSAGE } from '../../../base/tracks/constants';
import MuteEveryonesVideoDialog
    from '../../../video-menu/components/native/MuteEveryonesVideoDialog';

import styles from './styles';

export const ContextMenuMore = () => {
    const dispatch = useDispatch();
    const muteAllVideo = useCallback(() => {
        dispatch(openDialog('MuteEveryonesVideoDialog', MuteEveryonesVideoDialog));
        dispatch(hideSheet());
    }, [ dispatch ]);
    const conference = useSelector(getCurrentConference);
    const raisedHandsQueue = useSelector(getRaiseHandsQueue);
    const moderator = useSelector(isLocalParticipantModerator);
    const lowerAllHands = useCallback(() => {
        dispatch(raiseHand(false));
        conference?.sendEndpointMessage('', { name: LOWER_HAND_MESSAGE });
        dispatch(hideSheet());
    }, [ dispatch ]);
    const { t } = useTranslation();

    const isModerationSupported = useSelector((state: IReduxState) => isAvModerationSupported()(state));

    const isAudioModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.VIDEO));
    const isDesktopModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.DESKTOP));

    const moderationActions = [
        {
            disable: requestDisableAudioModeration,
            enable: requestEnableAudioModeration,
            enabled: isAudioModerationEnabled,
            labelKey: 'participantsPane.actions.audioModeration'
        },
        {
            disable: requestDisableVideoModeration,
            enable: requestEnableVideoModeration,
            enabled: isVideoModerationEnabled,
            labelKey: 'participantsPane.actions.videoModeration'
        },
        {
            disable: requestDisableDesktopModeration,
            enable: requestEnableDesktopModeration,
            enabled: isDesktopModerationEnabled,
            labelKey: 'participantsPane.actions.desktopModeration'
        }
    ];

    return (
        <BottomSheet
            addScrollViewPadding = { false }
            showSlidingView = { true }>
            <TouchableOpacity
                accessibilityLabel = { t('participantsPane.actions.stopEveryonesVideo') }
                accessibilityRole = 'button'
                onPress = { muteAllVideo }
                style = { styles.contextMenuItem as ViewStyle }>
                <Icon
                    size = { 24 }
                    src = { IconVideoOff } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.stopEveryonesVideo')}</Text>
            </TouchableOpacity>
            { moderator && raisedHandsQueue.length !== 0 && <TouchableOpacity
                accessibilityLabel = { t('participantsPane.actions.lowerAllHands') }
                accessibilityRole = 'button'
                onPress = { lowerAllHands }
                style = { styles.contextMenuItem as ViewStyle }>
                <Icon
                    size = { 24 }
                    src = { IconRaiseHand } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.lowerAllHands')}</Text>
            </TouchableOpacity> }
            {isModerationSupported && <>
                {/* @ts-ignore */}
                <Divider style = { styles.divider } />
                <View style = { styles.contextMenuItem as ViewStyle }>
                    <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.allow')}</Text>
                </View>
                {moderationActions.map(({ disable, enable, enabled, labelKey }) => (

                    // Moderation on means non-moderators are not allowed, so no check and not selected.
                    <TouchableOpacity
                        accessibilityLabel = { t(labelKey) }
                        accessibilityRole = 'button'
                        accessibilityState = {{ selected: !enabled }}
                        key = { labelKey }
                        onPress = { () => dispatch(enabled ? disable() : enable()) }
                        style = { styles.contextMenuItem as ViewStyle }>
                        {!enabled && <Icon
                            size = { 24 }
                            src = { IconCheck } />}
                        <Text style = { enabled ? styles.contextMenuItemTextNoIcon : styles.contextMenuItemText }>
                            {t(labelKey)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </>}
        </BottomSheet>
    );
};
