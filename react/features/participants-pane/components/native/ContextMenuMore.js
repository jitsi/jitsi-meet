// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog, hideDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon,
    IconVideoOff
} from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipantCount
} from '../../../base/participants';
import MuteEveryonesVideoDialog
    from '../../../video-menu/components/native/MuteEveryonesVideoDialog';

import styles from './styles';

export const ContextMenuMore = () => {
    const dispatch = useDispatch();
    const cancel = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const { id } = useSelector(getLocalParticipant);
    const participantsCount = useSelector(getParticipantCount);
    const showSlidingView = participantsCount > 2;
    const muteAllVideo = useCallback(() =>
        dispatch(openDialog(MuteEveryonesVideoDialog,
            { exclude: [ id ] })),
        [ dispatch ]);
    const { t } = useTranslation();

    return (
        <BottomSheet
            addScrollViewPadding = { false }
            onCancel = { cancel }
            showSlidingView = { showSlidingView }
            style = { styles.contextMenuMore }>
            <TouchableOpacity
                onPress = { muteAllVideo }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconVideoOff } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.stopEveryonesVideo')}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};
