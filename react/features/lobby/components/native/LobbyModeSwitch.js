// @flow

import React from 'react';
import { Switch, View } from 'react-native';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import {
    DISABLED_TRACK_COLOR,
    ENABLED_TRACK_COLOR,
    THUMB_COLOR
} from '../../../welcome/components/native/settings/components/styles';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link LobbyModeSwitch}.
 */
type Props = {

    /**
     * True if the lobby mode is currently enabled for this conference.
     */
    lobbyEnabled: boolean,

    /**
     * Callback to be invoked when handling enable-disable lobby mode switch.
     */
    onToggleLobbyMode: Function
};

/**
 * Component meant to Enable/Disable lobby mode.
 *
 * @returns {React$Element<any>}
 */
function LobbyModeSwitch(
        {
            lobbyEnabled,
            onToggleLobbyMode
        }: Props) {

    return (
        <View style = { styles.lobbySwitchContainer }>
            <Switch
                onValueChange = { onToggleLobbyMode }
                style = { styles.lobbySwitchIcon }
                thumbColor = { THUMB_COLOR }
                trackColor = {{
                    true: ENABLED_TRACK_COLOR,
                    false: DISABLED_TRACK_COLOR
                }}
                value = { lobbyEnabled } />
        </View>
    );
}

export default translate(connect()(LobbyModeSwitch));
