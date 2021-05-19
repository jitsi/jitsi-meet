// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { withTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { IconClose, IconHorizontalPoints } from '../../../base/icons';
import { JitsiModal } from '../../../base/modal';
import { isLocalParticipantModerator } from '../../../base/participants';
import { close } from '../../actions.native';

import Button from './Button';
import { LobbyParticipantList } from './LobbyParticipantList';
import styles from './styles';


/**
 * {@code ParticipantsPane}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * Theme used for styles.
     */
    theme: Object
}

/**
 * Participant pane.
 *
 * @returns {React$Element<any>}
 */
function ParticipantsPane({ theme }: Props) {
    const dispatch = useDispatch();
    const closePane = useCallback(
        () => dispatch(close()),
        [ dispatch ]);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const { t } = useTranslation();
    const { palette } = theme;

    return (
        <JitsiModal
            showHeaderWithNavigation = { false }
            style = { styles.participantsPane }>
            <View style = { styles.header }>
                <Button
                    contentStyle = { styles.muteAllContent }
                    iconButton = { true }
                    iconSize = { 16 }
                    iconSrc = { IconClose }
                    iconStyle = { styles.closeIcon }
                    mode = 'contained'
                    onPress = { closePane }
                    style = { styles.closeButton }
                    theme = {{
                        colors: {
                            primary: palette.action02
                        }
                    }} />
            </View>
            <LobbyParticipantList />
            {
                isLocalModerator
                && <View style = { styles.footer }>
                    <Button
                        content = { t('participantsPane.actions.muteAll') }
                        contentStyle = { styles.muteAllContent }
                        onPress = { closePane }
                        style = { styles.muteAllButton } />
                    <Button
                        contentStyle = { styles.muteAllContent }
                        iconButton = { true }
                        iconSize = { 16 }
                        iconSrc = { IconHorizontalPoints }
                        iconStyle = { styles.moreIcon }
                        mode = 'contained'
                        onPress = { closePane }
                        style = { styles.moreButton }
                        theme = {{
                            colors: {
                                primary: palette.action02
                            }
                        }} />
                </View>
            }
        </JitsiModal>
    );
}


export default withTheme(ParticipantsPane);
