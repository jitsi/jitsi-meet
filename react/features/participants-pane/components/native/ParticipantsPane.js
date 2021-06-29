// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { Icon, IconClose, IconHorizontalPoints } from '../../../base/icons';
import { JitsiModal } from '../../../base/modal';
import {
    getParticipantCount, isEveryoneModerator,
    isLocalParticipantModerator
} from '../../../base/participants';
import MuteEveryoneDialog
    from '../../../video-menu/components/native/MuteEveryoneDialog';
import { close } from '../../actions.native';

import { ContextMenuMore } from './ContextMenuMore';
import { LobbyParticipantList } from './LobbyParticipantList';
import { MeetingParticipantList } from './MeetingParticipantList';
import styles, { button } from './styles';

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
    const everyoneModerator = useSelector(isEveryoneModerator);
    const showContextMenu = !everyoneModerator && participantsCount > 2;
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)),
        [ dispatch ]);
    const { t } = useTranslation();

    return (
        <JitsiModal
            hideHeaderWithNavigation = { true }
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
            {
                isLocalModerator
                && <View style = { styles.footer }>
                    <Button
                        children = { t('participantsPane.actions.muteAll') }
                        contentStyle = { styles.muteAllContent }
                        labelStyle = { styles.muteAllLabel }
                        mode = 'contained'
                        onPress = { muteAll }
                        style = { showContextMenu ? styles.muteAllButton : button } />
                    {
                        showContextMenu
                        && <Button
                            contentStyle = { styles.moreIcon }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            icon = { () =>
                                (<Icon
                                    size = { 24 }
                                    src = { IconHorizontalPoints } />)
                            }
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
