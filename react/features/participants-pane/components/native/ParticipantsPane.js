// @flow

import React, { useCallback } from 'react';
import { Button, Text, withTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';


import { translate } from '../../../base/i18n';
import { JitsiModal } from '../../../base/modal';
import { close } from '../../actions';

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

    return (
        <JitsiModal
            headerProps = {{
                onPressBack: closePane()
            }}>
            {/* eslint-disable-next-line react/jsx-no-bind */}
            <Button onPress = { closePane }> X</Button>
            <Text>
                OLE
            </Text>
        </JitsiModal>
    );
}


export default translate(withTheme(ParticipantsPane));
