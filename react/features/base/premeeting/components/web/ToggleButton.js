// @flow

import React, { useCallback } from 'react';

import { Icon, IconCheck } from '../../../icons';

const mainClass = 'toggle-button';

type Props = {

    /**
     * Text of the button.
     */
    children: React$Node,

    /**
     * If the button is toggled or not.
     */
    isToggled?: boolean,

    /**
     * OnClick button handler.
     */
    onClick: Function
}

/**
 * Button used as a toggle.
 *
 * @returns {ReactElement}
 */
function ToggleButton({ children, isToggled, onClick }: Props) {
    const className = isToggled ? `${mainClass} ${mainClass}--toggled` : mainClass;

    const onKeyPressHandler = useCallback(e => {
        if (onClick && (e.key === ' ')) {
            e.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    return (
        <div
            aria-checked = { isToggled }
            className = { className }
            id = 'toggle-button'
            onClick = { onClick }
            onKeyPress = { onKeyPressHandler }
            role = 'switch'
            tabIndex = { 0 }>
            <div className = 'toggle-button-container'>
                <div className = 'toggle-button-icon-container'>
                    <Icon
                        className = 'toggle-button-icon'
                        size = { 10 }
                        src = { IconCheck } />
                </div>
                <label htmlFor = 'toggle-button'>{children}</label>
            </div>
        </div>
    );
}

export default ToggleButton;
