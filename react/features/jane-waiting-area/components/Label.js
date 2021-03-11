// @flow
/* eslint-disable require-jsdoc*/

import React from 'react';

type Props = {
    children: React$Node,
    className?: string,
    number?: string | number,
    onClick?: Function,
};


function Label({ children, className, number, onClick }: Props) {
    const containerClass = className
        ? `jane-waiting-area-dialog-label ${className}`
        : 'jane-waiting-area-dialog-label';

    return (
        <div
            className = { containerClass }
            onClick = { onClick }>
            {number
            && <div className = 'jane-waiting-area-dialog-label-num'>{number}</div>}
            <span>{children}</span>
        </div>
    );
}

export default Label;
