// @flow

import React, { useCallback } from 'react';

import { Icon, IconArrowDown } from '../../../base/icons';

type Props = {

    /**
     * Country object of the entry.
     */
    country: { name: string, dialCode: string, code: string },

    /**
     * Click handler for the selector.
     */
    onClick: Function,
};

/**
 * This component displays the country selector with the flag.
 *
 * @returns {ReactElement}
 */
function CountrySelector({ country: { code, dialCode }, onClick }: Props) {
    const onKeyPressHandler = useCallback(e => {
        if (onClick && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    return (
        <div
            className = 'cpick-selector'
            onClick = { onClick }
            onKeyPress = { onKeyPressHandler }>
            <div className = { `prejoin-dialog-flag iti-flag ${code}` } />
            <span>{`+${dialCode}`}</span>
            <Icon
                className = 'cpick-icon'
                size = { 16 }
                src = { IconArrowDown } />
        </div>
    );
}

export default CountrySelector;
