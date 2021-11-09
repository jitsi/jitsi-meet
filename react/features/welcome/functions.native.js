// @flow

/* eslint-disable */
import React from 'react';

import { IconArrowBack } from '../base/icons';
import HeaderNavigationButton
    from '../conference/components/native/HeaderNavigationButton';

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
            /* eslint-disable-next-line react/jsx-no-bind */
            onPress = { onPress }
            src = { IconArrowBack } />
    );
}
