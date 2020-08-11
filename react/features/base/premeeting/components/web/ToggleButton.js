// @flow

import React from 'react';

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

    return (
        <div
            className = { className }
            onClick = { onClick }>
            <div className = 'toggle-button-container'>
                <div className = 'toggle-button-icon-container'>
                    <Icon
                        className = 'toggle-button-icon'
                        size = { 10 }
                        src = { IconCheck } />
                </div>
                <span>{children}</span>
            </div>
        </div>
    );
}

export default ToggleButton;
