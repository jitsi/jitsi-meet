// @flow

import React from 'react';
import { Icon, IconArrowDown } from '../../../base/icons';

const classNameByType = {
    primary: 'prejoin-btn--primary',
    secondary: 'prejoin-btn--secondary',
    text: 'prejoin-btn--text'
};

type Props = {

    /**
     * Text of the button.
     */
    children: React$Node,

    /**
     * Text css class of the button.
     */
    className?: string,

    /**
     * If the button has options.
     */
    hasOptions?: boolean,

    /**
     * The type of th button: primary, secondary, text.
     */
    type: string,

    /**
     * OnClick button handler.
     */
    onClick: Function,

    /**
     * Click handler for options.
     */
    onOptionsClick?: Function
};

/**
 * Button used for prejoin actions: Join/Join without audio/Join by phone.
 *
 * @returns {ReactElement}
 */
function ActionButton({ children, className, hasOptions, type, onClick, onOptionsClick }: Props) {
    const ownClassName = `prejoin-btn ${classNameByType[type]}`;
    const cls = className ? `${className} ${ownClassName}` : ownClassName;

    return (
        <div
            className = { cls }
            onClick = { onClick }>
            {children}
            {hasOptions && <div
                className = 'prejoin-btn-options'
                onClick = { onOptionsClick }>
                <Icon
                    className = 'prejoin-btn-icon'
                    size = { 14 }
                    src = { IconArrowDown } />
            </div>
            }
        </div>
    );
}

export default ActionButton;
