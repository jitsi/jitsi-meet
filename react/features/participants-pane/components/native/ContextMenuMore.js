// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { hideDialog } from '../../../base/dialog';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import {
    Icon, IconMicDisabledHollow,
    IconVideoOff
} from '../../../base/icons';
import { MEDIA_TYPE } from '../../../base/media';
import {
    muteAllParticipants,
    unmuteDisabled
} from '../../../video-menu/actions.any';

import styles from './styles';
type Props = {

    /**
     * Array of participant IDs to not mute
     */
    exclude: Array<string>,

    /**
     * Participant reference
     */
    participant: Object
};

export const ContextMenuMore = ({ exclude }: Props) => {
    const dispatch = useDispatch();
    const cancel = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const unMuteDisabled = useCallback(() => dispatch(unmuteDisabled()), [ dispatch ]);
    const muteEveryoneVideo = useCallback(() => dispatch(muteAllParticipants(exclude, MEDIA_TYPE.VIDEO)), [ dispatch ]);
    const { t } = useTranslation();

    return (
        <BottomSheet
            onCancel = { cancel }
            style = { styles.contextMenuMore }>
            <TouchableOpacity
                onPress = { muteEveryoneVideo }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconVideoOff } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.stopEveryonesVideo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress = { unMuteDisabled }
                style = { styles.contextMenuItem }>
                <Icon
                    size = { 24 }
                    src = { IconMicDisabledHollow }
                    style = { styles.contextMenuIcon } />
                <Text style = { styles.contextMenuItemText }>{t('participantsPane.actions.dontAllowUnmute')}</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};
