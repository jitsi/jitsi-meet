// @flow

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { isIosMobileBrowser } from '../../../base/environment/utils';

const Avoider = styled.div`
    height: ${props => props.elementHeight}px;
`;

/**
 * Component that renders an element to lift the chat input above the Safari keyboard,
 * computing the appropriate height comparisons based on the {@code visualViewport}.
 *
 * @returns {ReactElement}
 */
function KeyboardAvoider() {
    if (!isIosMobileBrowser()) {
        return null;
    }

    const [ elementHeight, setElementHeight ] = useState(0);
    const [ storedHeight, setStoredHeight ] = useState(window.innerHeight);

    /**
     * Handles the resizing of the visual viewport in order to compute
     * the {@code KeyboardAvoider}'s height.
     *
     * @returns {void}
     */
    function handleViewportResize() {
        const { innerWidth, visualViewport: { width, height } } = window;

        // Compare the widths to make sure the {@code visualViewport} didn't resize due to zooming.
        if (width === innerWidth) {
            if (height < storedHeight) {
                setElementHeight(storedHeight - height);
            } else {
                setElementHeight(0);
            }
            setStoredHeight(height);
        }
    }

    useEffect(() => {
        // Call the handler in case the keyboard is open when the {@code KeyboardAvoider} is mounted.
        handleViewportResize();

        window.visualViewport.addEventListener('resize', handleViewportResize);

        return () => {
            window.visualViewport.removeEventListener('resize', handleViewportResize);
        };
    }, []);

    return <Avoider elementHeight = { elementHeight } />;
}

export default KeyboardAvoider;
