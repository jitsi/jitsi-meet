import React from 'react';
import { WithTranslation } from 'react-i18next';
import { View } from 'react-native';

import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Switch from '../../../base/ui/components/native/Switch';
import {
    DISABLED_TRACK_COLOR,
    ENABLED_TRACK_COLOR,
    THUMB_COLOR

    // @ts-ignore
} from '../../../settings/components/native/styles';

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
                style = { styles.lobbySwitchIcon }
                thumbColor = { THUMB_COLOR }
                trackColor = {{
                    true: ENABLED_TRACK_COLOR,
                    false: DISABLED_TRACK_COLOR
                }} />
        </View>
    );
}

export default translate(connect()(LobbyModeSwitch));
