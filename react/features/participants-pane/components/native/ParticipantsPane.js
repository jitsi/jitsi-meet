// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { Icon, IconHorizontalPoints } from '../../../base/icons';
import { JitsiModal } from '../../../base/modal';
import {
    getParticipantCount,
    isLocalParticipantModerator
} from '../../../base/participants';
import MuteEveryoneDialog
    from '../../../video-menu/components/native/MuteEveryoneDialog';
import { close } from '../../actions.native';

import { ContextMenuMore } from './ContextMenuMore';
import LobbyParticipantList from './LobbyParticipantList';
import MeetingParticipantList from './MeetingParticipantList';
import styles from './styles';

/**
 * Participant pane.
 *
 * @returns {React$Element<any>}
 */
const ParticipantsPane = () => {
    const dispatch = useDispatch();
    const openMoreMenu = useCallback(() => dispatch(openDialog(ContextMenuMore)), [ dispatch ]);
    const closePane = useCallback(() => dispatch(close()), [ dispatch ]);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const participantsCount = useSelector(getParticipantCount);
    const showContextMenu = participantsCount > 2;
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)),
        [ dispatch ]);
    const { t } = useTranslation();

    return (
        <JitsiModal
            headerProps = {{
                headerLabelKey: 'participantsPane.header'
            }}
            onClose = { closePane }
            style = { styles.participantsPane }>
            <ScrollView>
                <LobbyParticipantList />
                <MeetingParticipantList />
            </ScrollView>
            {
                isLocalModerator
                && <View style = { styles.footer }>
                    <Button
                        children = { t('participantsPane.actions.muteAll') }
                        labelStyle = { styles.muteAllLabel }
                        mode = 'contained'
                        onPress = { muteAll }
                        style = { showContextMenu ? styles.muteAllMoreButton : styles.muteAllButton } />
                    {
                        showContextMenu
                        && <Button
                            /* eslint-disable-next-line react/jsx-no-bind */
                            icon = { () =>
                                (<Icon
                                    size = { 20 }
                                    src = { IconHorizontalPoints } />)
                            }
                            labelStyle = { styles.moreIcon }
                            mode = 'contained'
                            onPress = { openMoreMenu }
                            style = { styles.moreButton } />
                    }
                </View>
            }
        </JitsiModal>
    );
};

export default ParticipantsPane;
