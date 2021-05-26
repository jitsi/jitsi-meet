// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { hideDialog, openDialog } from '../../../base/dialog';
import { Icon, IconClose, IconHorizontalPoints } from '../../../base/icons';
import { JitsiModal } from '../../../base/modal';
import MuteEveryoneDialog
    from '../../../video-menu/components/native/MuteEveryoneDialog';

import { LobbyParticipantList } from './LobbyParticipantList';
import { MeetingParticipantList } from './MeetingParticipantList';
import styles from './styles';

/**
 * Participant pane.
 *
 * @returns {React$Element<any>}
 */
export function ParticipantsPane() {
    const dispatch = useDispatch();
    const closePane = useCallback(
        () => dispatch(hideDialog()),
        [ dispatch ]);
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)),
        [ dispatch ]);
    const { t } = useTranslation();

    return (
        <JitsiModal
            showHeaderWithNavigation = { false }
            style = { styles.participantsPane }>
            <View style = { styles.header }>
                <Button
                    contentStyle = { styles.closeIcon }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    icon = { () =>
                        (<Icon
                            size = { 24 }
                            src = { IconClose } />)
                    }
                    mode = 'contained'
                    onPress = { closePane }
                    style = { styles.closeButton } />
            </View>
            <ScrollView>
                <LobbyParticipantList />
                <MeetingParticipantList />
            </ScrollView>
            <View style = { styles.footer }>
                <Button
                    children = { t('participantsPane.actions.muteAll') }
                    labelStyle = { styles.muteAllLabel }
                    onPress = { muteAll }
                    style = { styles.muteAllButton } />
                <Button
                    contentStyle = { styles.moreIcon }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    icon = { () =>
                        (<Icon
                            size = { 24 }
                            src = { IconHorizontalPoints } />)
                    }
                    mode = 'contained'
                    style = { styles.moreButton } />
            </View>
        </JitsiModal>
    );
}


export default ParticipantsPane;
