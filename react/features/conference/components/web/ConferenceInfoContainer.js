/* @flow */

import React from 'react';

type Props = {

    /**
     * The children components.
     */
     children: React$Node,

     /**
      * Whether this conference info container should be visible or not.
      */
     visible: boolean
}

export default ({ visible, children }: Props) => (
    <div className = { `subject${visible ? ' visible' : ''}` }>
        <div className = { 'subject-info-container' }>
            {children}
        </div>
    </div>
);
