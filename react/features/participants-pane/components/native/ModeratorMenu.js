import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import {
    requestDisableAudioModeration,
    requestDisableVideoModeration,
    requestEnableAudioModeration,
    requestEnableVideoModeration
} from '../../../av-moderation/actions';
import {
    isSupported as isAvModerationSupported,
    isEnabled as isAvModerationEnabled
} from '../../../av-moderation/functions';
import { openDialog, hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon,
    IconCheck,
    IconMicrophoneEmptySlash,
    IconVideoOff
} from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import { getParticipantCount, isEveryoneModerator } from '../../../base/participants';
import MuteEveryoneDialog from '../../../video-menu/components/native/MuteEveryoneDialog';
import MuteEveryonesVideoDialog
    from '../../../video-menu/components/native/MuteEveryonesVideoDialog';

import styles from './styles';

export const ModeratorMenu = () => {
    const dispatch = useDispatch();
    const muteAll = useCallback(() => {
        dispatch(openDialog(MuteEveryoneDialog));
        dispatch(hideSheet());
    }, [ dispatch ]);
    const muteAllVideo = useCallback(() => {
        dispatch(openDialog(MuteEveryonesVideoDialog));
        dispatch(hideSheet());
    }, [ dispatch ]);
    const { t } = useTranslation();

    const isModerationSupported = useSelector(isAvModerationSupported);
    const allModerators = useSelector(isEveryoneModerator);
    const participantCount = useSelector(getParticipantCount);

    const isAudioModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.AUDIO));
    const isVideoModerationEnabled = useSelector(isAvModerationEnabled(MEDIA_TYPE.VIDEO));

    const disableAudioModeration = useCallback(() => dispatch(requestDisableAudioModeration()), [ dispatch ]);
    const disableVideoModeration = useCallback(() => dispatch(requestDisableVideoModeration()), [ dispatch ]);

    const enableAudioModeration = useCallback(() => dispatch(requestEnableAudioModeration()), [ dispatch ]);
    const enableVideoModeration = useCallback(() => dispatch(requestEnableVideoModeration()), [ dispatch ]);

    return (
        <BottomSheet
            addScrollViewPadding = { false }
            showSlidingView = { true }>
            <TouchableOpacity
                onPress = { muteAll }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconMicrophoneEmptySlash } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.muteAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress = { muteAllVideo }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconVideoOff } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.stopEveryonesVideo')}</Text>
            </TouchableOpacity>
            {isModerationSupported && ((participantCount === 1 || !allModerators)) && <>
                <Divider style = { styles.divider } />
                <View style = { styles.contextMenuItem }>
                    <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.allow')}</Text>
                </View>
                {isAudioModerationEnabled
                    ? <TouchableOpacity
                        onPress = { disableAudioModeration }
                        style = { styles.contextMenuItem }>
                        <Text style = { styles.contextMenuItemTextNoIcon }>
                            {t('participantsPane.actions.audioModeration')}
                        </Text>
                    </TouchableOpacity>
                    : <TouchableOpacity
                        onPress = { enableAudioModeration }
                        style = { styles.contextMenuItem }>
                        <Icon
                            size = { 24 }
                            src = { IconCheck } />
                        <Text style = { styles.contextMenuItemText }>
                            {t('participantsPane.actions.audioModeration')}
                        </Text>
                    </TouchableOpacity> }
                {isVideoModerationEnabled
                    ? <TouchableOpacity
                        onPress = { disableVideoModeration }
                        style = { styles.contextMenuItem }>
                        <Text style = { styles.contextMenuItemTextNoIcon }>
                            {t('participantsPane.actions.videoModeration')}
                        </Text>
                    </TouchableOpacity>
                    : <TouchableOpacity
                        onPress = { enableVideoModeration }
                        style = { styles.contextMenuItem }>
                        <Icon
                            size = { 24 }
                            src = { IconCheck } />
                        <Text style = { styles.contextMenuItemText }>
                            {t('participantsPane.actions.videoModeration')}
                        </Text>
                    </TouchableOpacity>}
            </>}
        </BottomSheet>
    );
};
