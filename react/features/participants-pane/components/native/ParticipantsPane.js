// @flow

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, withTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';

import { Icon, IconClose, IconHorizontalPoints } from '../../../base/icons';
import { JitsiModal } from '../../../base/modal';
import { close } from '../../actions.any';

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
    const { t } = useTranslation();
    const { palette } = theme;

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
                    style = { styles.closeButton }
                    theme = {{
                        colors: {
                            primary: palette.action02
                        }
                    }} />
            </View>
            <LobbyParticipantList />
            <View style = { styles.footer }>
                <Button
                    color = { palette.text01 }
                    compact = { true }
                    contentStyle = { styles.muteAllContent }
                    onPress = { closePane }
                    style = { styles.muteAllButton } >
                    { t('participantsPane.actions.muteAll') }
                </Button>
                <Button
                    contentStyle = { styles.moreIcon }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    icon = { () =>
                        (<Icon
                            size = { 24 }
                            src = { IconHorizontalPoints } />)
                    }
                    mode = 'contained'
                    onPress = { closePane }
                    style = { styles.moreButton }
                    theme = {{
                        colors: {
                            primary: palette.action02
                        }
                    }} />
            </View>
        </JitsiModal>
    );
}


export default withTheme(ParticipantsPane);
