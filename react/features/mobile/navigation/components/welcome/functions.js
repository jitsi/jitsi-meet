// @flow

import React from 'react';

import { IconArrowBack } from '../../../../base/icons/svg';
import HeaderNavigationButton
    from '../HeaderNavigationButton';


/**
 * Render header arrow back button for navigation.
 *
 * @param {Function} onPress - Callback for when the button is pressed
 * function.
 * @returns {ReactElement}
 */
export function renderArrowBackButton(onPress: Function) {
    return (
        <HeaderNavigationButton
            onPress = { onPress }
            src = { IconArrowBack } />
    );
}
