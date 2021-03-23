// @flow

import React from 'react';
import { Switch, Text, View } from 'react-native';

import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';

import styles, {
    DISABLED_THUMB_COLOR,
    ENABLED_THUMB_COLOR, ENABLED_TRACK_COLOR
} from './styles';

/**
 * The type of the React {@code Component} props of {@link RoomLockSwitch}.
 */
type Props = {

    /**
     * Checks if the room is locked based on defined room lock constants.
     */
    locked: boolean,

    /**
     * Callback to be invoked when the user toggles room lock.
     */
    onToggleRoomLock: Function,

    /**
     * Control for room lock.
     */
    toggleRoomLock: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Component meant to Add/Remove meeting password.
 *
 * @returns {React$Element<any>}
 */
function RoomLockSwitch(
        {
            locked,
            onToggleRoomLock,
            toggleRoomLock,
            t
        }: Props) {

    return (
        <View style = { styles.roomLockSwitchContainer }>
            <Text>
                {
                    locked
                        && t('passwordSetRemotely')
                }
            </Text>
            <Switch
                disabled = { locked }
                onValueChange = { onToggleRoomLock }
                thumbColor = {
                    toggleRoomLock
                        ? ENABLED_THUMB_COLOR
                        : DISABLED_THUMB_COLOR
                }
                trackColor = {{ true: ENABLED_TRACK_COLOR }}
                value = { toggleRoomLock } />
        </View>
    );
}

export default translate(connect()(RoomLockSwitch));
