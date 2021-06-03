// @flow

import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

type Props = {

    /**
     * Action to be dispatched on click.
     */
    action: Function,

    /**
     * The text of the button.
     */
    children: React$Node,

    /**
     * CSS class of the button.
     */
    className: string,

    /**
     * The `data-testid` used for the button.
     */
    testId: string,

    /**
     * The participant.
     */
    participant: Object
}

/**
 * Component used to display an approve/reject button.
 *
 * @returns {React$Element<'button'>}
 */
export default function({ action, children, className, testId, participant }: Props) {
    const dispatch = useDispatch();
    const onClick = useCallback(() => dispatch(action(participant.id)), [ dispatch, participant ]);

    return (
        <button
            className = { className }
            data-testid = { testId }
            onClick = { onClick }
            type = 'button'>
            { children }
        </button>
    );
}
