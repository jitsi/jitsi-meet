// @flow
/* eslint-disable require-jsdoc*/
import React from 'react';

const classNameByType = {
    primary: 'jane-waiting-area-btn--primary',
    secondary: 'jane-waiting-area-btn--secondary',
    available: 'jane-waiting-area-btn--available',
    text: 'jane-waiting-area-btn--text',
    close: 'jane-waiting-area-btn--close'
};

type Props = {
    children: React$Node,
    className?: string,
    disabled?: boolean,
    hasOptions?: boolean,
    type: string,
    onClick: Function,
};

function ActionButton({ children, className, disabled, type, onClick }: Props) {
    let ownClassName = 'jane-waiting-area-btn';
    let clickHandler = onClick;

    if (disabled) {
        clickHandler = null;
        ownClassName = `${ownClassName} jane-waiting-area-btn--disabled`;
    } else {
        ownClassName = `${ownClassName} ${classNameByType[type]}`;
    }
    const cls = className ? `${className} ${ownClassName}` : ownClassName;

    return (
        <div
            className = { cls }
            onClick = { clickHandler }>
            {children}
        </div>
    );
}

export default ActionButton;
