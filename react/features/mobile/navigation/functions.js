import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';


import { appNavigate } from '../../app/actions';
import {
    getFeatureFlag,
    PREJOIN_PAGE_ENABLED
} from '../../base/flags';
import { IconClose } from '../../base/icons';
import { toState } from '../../base/redux';
import { cancelKnocking } from '../../lobby/actions.native';

import HeaderNavigationButton from './components/HeaderNavigationButton';


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
    return getFeatureFlag(toState(stateful), PREJOIN_PAGE_ENABLED, true);
}

/**
 * Close icon/text button for lobby screen based on platform.
 *
 * @returns {React.Component}
 */
export function lobbyScreenHeaderCloseButton() {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const goBack = useCallback(() => {
        dispatch(cancelKnocking());
        dispatch(appNavigate(undefined));
    }, [ dispatch ]);

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
 * Returns true if we should auto-knock in case prejoin is enabled for the room.
 *
 * @param {Function|Object} stateful - The redux state or {@link getState}
 * function.
 * @returns {boolean}
 */
export function shouldEnableAutoKnock(stateful: Function | Object) {
    const state = toState(stateful);
    const { displayName } = state['features/base/settings'];

    if (isPrejoinPageEnabled(state)) {
        if (displayName) {
            return true;
        }
    } else {
        return false;
    }
}
