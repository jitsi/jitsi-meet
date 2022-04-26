import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { IconClose } from '../../base/icons';

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
