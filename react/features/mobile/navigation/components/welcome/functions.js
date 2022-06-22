// @flow

import React from 'react';

import { IconArrowBack } from '../../../../base/icons';
import HeaderNavigationButton
    from '../HeaderNavigationButton';
import { navigationStyles } from '../styles';


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
            buttonStyle = { navigationStyles.arrowBackStyle }
            onPress = { onPress }
            src = { IconArrowBack } />
    );
}
