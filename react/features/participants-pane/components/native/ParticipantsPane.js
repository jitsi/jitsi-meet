// @flow

import React, { useCallback } from 'react';
import { Button, withTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';


import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import { JitsiModal } from '../../../base/modal';
import { close } from '../../actions';

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

    const { palette } = theme;

    return (
        <JitsiModal
            showHeaderWithNavigation = { false }
            style = { styles.participantsPane }>
            <Button
                mode = 'contained'
                onPress = { closePane }
                style = { styles.closeButton }
                theme = {{
                    colors: {
                        primary: palette.action02
                    }
                }}>
                <Icon
                    src = { IconClose }
                    style = { styles.closeIcon } />
            </Button>
        </JitsiModal>
    );
}


export default translate(withTheme(ParticipantsPane));
