import React from 'react';
import { GestureResponderEvent } from 'react-native';

import { IStateful } from '../../base/app/types';
import { PREJOIN_PAGE_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { toState } from '../../base/redux/functions';
import { isPrejoinEnabledInConfig } from '../../prejoin/functions.native';

import LobbyCloseButton from './components/LobbyCloseButton';
import ScreenCloseButton from './components/ScreenCloseButton';

/**
 * Close icon/text button based on platform.
 *
 * @param {Function} goBack - Goes back to the previous screen function.
 * @returns {React.Component}
 */
export function screenHeaderCloseButton(goBack: (e?: GestureResponderEvent | React.MouseEvent) => void) {
    return () => <ScreenCloseButton goBack = { goBack } />;
}

/**
 * Determines whether the {@code Prejoin page} is enabled by the app itself
 * (e.g. Programmatically via the Jitsi Meet SDK for Android and iOS).
 *
 * @param {Function|Object} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean} If the {@code Prejoin} is enabled by the app, then
 * {@code true}; otherwise, {@code false}.
 */
export function isPrejoinPageEnabled(stateful: IStateful) {
    const state = toState(stateful);

    return getFeatureFlag(state, PREJOIN_PAGE_ENABLED, isPrejoinEnabledInConfig(state));
}

/**
 * Close icon/text button for lobby screen based on platform.
 *
 * @returns {React.Component}
 */
export function lobbyScreenHeaderCloseButton() {
    return LobbyCloseButton;
}
