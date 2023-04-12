import React from 'react';

import { isAlwaysOnTitleBarEmpty } from '../functions.web';

interface IProps {

    /**
     * The children components.
     */
    children: React.ReactNode;

    /**
     * Id of the component.
     */
    id?: string;

    /**
    * Whether this conference info container should be visible or not.
    */
    visible: boolean;
}

export default ({ visible, children, id }: IProps) => (
    <div
        className = { `subject${isAlwaysOnTitleBarEmpty() ? '' : ' with-always-on'}${visible ? ' visible' : ''}` }
        id = { id }>
        <div className = { 'subject-info-container' }>
            {children}
        </div>
    </div>
);
