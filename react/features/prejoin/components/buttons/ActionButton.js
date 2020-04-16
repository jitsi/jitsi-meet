// @flow

import React from 'react';
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
     * The type of th button: primary, secondary, text.
     */
    type: string,

    /**
     * OnClick button handler.
     */
    onClick: Function,
};

/**
 * Button used for prejoin actions: Join/Join without audio/Join by phone.
 *
 * @returns {ReactElement}
 */
function ActionButton({ children, className, type, onClick }: Props) {
    const ownClassName = `prejoin-btn ${classNameByType[type]}`;
    const cls = className ? `${className} ${ownClassName}` : ownClassName;

    return (
        <div
            className = { cls }
            onClick = { onClick }>
            {children}
        </div>
    );
}

export default ActionButton;
