import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureResponderEvent, Platform } from 'react-native';
import { useDispatch } from 'react-redux';


import { appNavigate } from '../../app/actions.native';
import { IStateful } from '../../base/app/types';
import { PREJOIN_PAGE_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { IconCloseLarge } from '../../base/icons/svg';
import { toState } from '../../base/redux/functions';
import { cancelKnocking } from '../../lobby/actions.native';
import { isPrejoinEnabledInConfig } from '../../prejoin/functions.native';

import HeaderNavigationButton from './components/HeaderNavigationButton';

/**
 * Screen close button component.
 */
const ScreenCloseButton = React.memo(({ goBack, isIos }: { goBack: (e?: GestureResponderEvent | React.MouseEvent) => void; isIos: boolean }) => {
    const { t } = useTranslation();

    if (isIos) {
        return (
            <HeaderNavigationButton
                id = { 'close-screen-button' }
                label = { t('dialog.close') }
                onPress = { goBack } />
        );
    }

    return (
        <HeaderNavigationButton
            id = { 'close-screen-button' }
            onPress = { goBack }
            src = { IconCloseLarge } />
    );
});

ScreenCloseButton.displayName = 'ScreenCloseButton';

/**
 * Close icon/text button based on platform.
 *
 * @param {Function} goBack - Goes back to the previous screen function.
 * @returns {React.Component}
 */
export function screenHeaderCloseButton(goBack: (e?: GestureResponderEvent | React.MouseEvent) => void) {
    return () => <ScreenCloseButton goBack = { goBack } isIos = { Platform.OS === 'ios' } />;
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
 * Lobby close button component.
 */
const LobbyCloseButton = React.memo(() => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const goBack = useCallback(() => {
        dispatch(cancelKnocking());
        dispatch(appNavigate(undefined));
    }, [ dispatch ]);

    if (Platform.OS === 'ios') {
        return (
            <HeaderNavigationButton
                id = { 'close-screen-button' }
                label = { t('dialog.close') }
                onPress = { goBack } />
        );
    }

    return (
        <HeaderNavigationButton
            id = { 'close-screen-button' }
            onPress = { goBack }
            src = { IconCloseLarge } />
    );
});

LobbyCloseButton.displayName = 'LobbyCloseButton';

/**
 * Close icon/text button for lobby screen based on platform.
 *
 * @returns {React.Component}
 */
export function lobbyScreenHeaderCloseButton() {
    return () => <LobbyCloseButton />;
}
