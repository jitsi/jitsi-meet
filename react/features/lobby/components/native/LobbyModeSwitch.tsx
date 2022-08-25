import React from 'react';
import { WithTranslation } from 'react-i18next';
import { View } from 'react-native';

import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Switch from '../../../base/ui/components/native/Switch';

// @ts-ignore
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link LobbyModeSwitch}.
 */
interface Props extends WithTranslation {

    /**
     * True if the lobby mode is currently enabled for this conference.
     */
    lobbyEnabled: boolean,

    /**
     * Callback to be invoked when handling enable-disable lobby mode switch.
     */
    onToggleLobbyMode: (on?: boolean) => void;
}

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
                checked = { lobbyEnabled }
                onChange = { onToggleLobbyMode }
                style = { styles.lobbySwitchIcon } />
        </View>
    );
}

export default translate(connect()(LobbyModeSwitch));
