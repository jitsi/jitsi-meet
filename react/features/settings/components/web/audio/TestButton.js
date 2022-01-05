// @flow

import React from 'react';

type Props = {

    /**
     * Click handler for the button.
     */
    onClick: Function,

    /**
     * Keypress handler for the button.
     */
    onKeyPress: Function,
};

/**
 * React {@code Component} representing an button used for testing output sound.
 *
 * @returns { ReactElement}
 */
export default function TestButton({ onClick, onKeyPress }: Props) {
    return (
        <div
            className = 'audio-preview-test-button'
            onClick = { onClick }
            onKeyPress = { onKeyPress }
            role = 'button'
            tabIndex = { 0 }>
            Test
        </div>
    );
}
