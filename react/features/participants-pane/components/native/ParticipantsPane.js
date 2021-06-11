// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector, connect } from 'react-redux';

import { hideDialog, openDialog } from '../../../base/dialog';
import { Icon, IconClose, IconHorizontalPoints } from '../../../base/icons';
import { JitsiModal } from '../../../base/modal';
import {
    isLocalParticipantModerator
} from '../../../base/participants';
import MuteEveryoneDialog
    from '../../../video-menu/components/native/MuteEveryoneDialog';
import { PARTICIPANTS_PANE_ID } from '../../constants';

import { ContextMenuMore } from './ContextMenuMore';
import { LobbyParticipantList } from './LobbyParticipantList';
import { MeetingParticipantList } from './MeetingParticipantList';
import styles from './styles';

type Props = {

    /**
     * Is the participants pane open
     */
    _isOpen: boolean
};

/**
 * Participant pane.
 *
 * @returns {React$Element<any>}
 */
function ParticipantsPane({ _isOpen: paneOpen }: Props) {
    const dispatch = useDispatch();
    const openMoreMenu = useCallback(() => dispatch(openDialog(ContextMenuMore)), [ dispatch ]);
    const closePane = useCallback(() => dispatch(hideDialog()), [ dispatch ]);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const muteAll = useCallback(() => dispatch(openDialog(MuteEveryoneDialog)),
        [ dispatch ]);
    const { t } = useTranslation();

    return (
        paneOpen
        && <JitsiModal
            hideHeaderWithNavigation = { true }
            modalId = { PARTICIPANTS_PANE_ID }
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
                        onPress = { openMoreMenu }
                        style = { styles.moreButton } />
                </View>
            }
        </JitsiModal>
    );
}

/**
 * Maps (parts of) the redux state to {@link ParticipantsPane} React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *     _isOpen: boolean,
 * }}
 */
function _mapStateToProps(state: Object) {
    const { isOpen } = state['features/participants-pane'];

    return {
        _isOpen: isOpen
    };
}


export default connect(_mapStateToProps)(ParticipantsPane);
