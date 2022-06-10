import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useDispatch, useStore } from 'react-redux';

import {
    getFeatureFlag,
    PREJOIN_PAGE_ENABLED
} from '../../base/flags';
import { IconClose } from '../../base/icons';

import HeaderNavigationButton from './components/HeaderNavigationButton';
import { goBackToRoot } from './rootNavigationContainerRef';

/**
 * Close icon/text button based on platform.
 *
 * @param {Function} goBack - Goes back to the previous screen function.
 * @returns {React.Component}
 */
export function screenHeaderCloseButton(goBack: Function) {
    const { t } = useTranslation();

    if (Platform.OS === 'ios') {
        return (
            <HeaderNavigationButton
                label = { t('dialog.close') }
                onPress = { goBack } />
        );
    }

    return (
        <HeaderNavigationButton
            onPress = { goBack }
            src = { IconClose } />
    );
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
export function isPrejoinPageEnabled(stateful: Function | Object) {
    return getFeatureFlag(stateful, PREJOIN_PAGE_ENABLED, true);
}

/**
 * Close icon/text button for lobby screen based on platform.
 *
 * @returns {React.Component}
 */
export function lobbyScreenHeaderCloseButton() {
    const dispatch = useDispatch();
    const store = useStore();
    const state = store.getState();
    const { t } = useTranslation();
    const goBack = useCallback(() =>
        goBackToRoot(state, dispatch), [ state, dispatch ]
    );

    if (Platform.OS === 'ios') {
        return (
            <HeaderNavigationButton
                label = { t('dialog.close') }
                onPress = { goBack } />
        );
    }

    return (
        <HeaderNavigationButton
            onPress = { goBack }
            src = { IconClose } />
    );
}
