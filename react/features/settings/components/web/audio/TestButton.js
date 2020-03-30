// @flow

import React from 'react';

type Props = {

    /**
     * Click handler for the button.
     */
    onClick: Function,
};

/**
 * React {@code Component} representing an button used for testing output sound.
 *
 * @returns { ReactElement}
 */
export default function TestButton({ onClick }: Props) {
    return (
        <div
            className = 'audio-preview-test-button'
            onClick = { onClick }>
            Test
        </div>
    );
}
