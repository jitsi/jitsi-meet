import React from 'react';
import { useTranslation } from 'react-i18next';
import { GestureResponderEvent, Platform } from 'react-native';

import { IconCloseLarge } from '../../../base/icons/svg';

import HeaderNavigationButton from './HeaderNavigationButton';

interface IProps {

    /**
     * Goes back to the previous screen function.
     */
    goBack: (e?: GestureResponderEvent | React.MouseEvent) => void;
}

/**
 * Close icon/text button based on platform.
 *
 * @returns {React.Component}
 */
const ScreenCloseButton = React.memo(({ goBack }: IProps) => {
    const { t } = useTranslation();

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

ScreenCloseButton.displayName = 'ScreenCloseButton';

export default ScreenCloseButton;
