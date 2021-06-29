// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog, hideDialog } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconMicDisabledHollow,
    IconVideoOff
} from '../../../base/icons';
import { getLocalParticipant } from '../../../base/participants';
import { BlockAudioVideoDialog } from '../../../video-menu';
import MuteEveryonesVideoDialog
    from '../../../video-menu/components/native/MuteEveryonesVideoDialog';

import styles from './styles';

export const ContextMenuMore = () => {
    const dispatch = useDispatch();
    const blockAudioVideo = useCallback(() => dispatch(openDialog(BlockAudioVideoDialog)), [ dispatch ]);
    const cancel = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const { id } = useSelector(getLocalParticipant);
    const muteAllVideo = useCallback(() =>
        dispatch(openDialog(MuteEveryonesVideoDialog,
            { exclude: [ id ] })),
        [ dispatch ]);
    const { t } = useTranslation();

    return (
        <BottomSheet
            onCancel = { cancel }
            style = { styles.contextMenuMore }>
            <TouchableOpacity
                onPress = { muteAllVideo }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 20 }
                    src = { IconVideoOff } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.stopEveryonesVideo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress = { blockAudioVideo }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 20 }
                    src = { IconMicDisabledHollow }
                    style = { styles.contextMenuIcon } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.blockAudioVideo')}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};
