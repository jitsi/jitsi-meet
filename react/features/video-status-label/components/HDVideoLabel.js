import React from 'react';

/**
 * A functional React {@code Component} for showing an HD status label.
 *
 * @returns {ReactElement}
 */
export default function HDVideoLabel() {
    return (
        <span
            className = 'video-state-indicator moveToCorner'
            id = 'videoResolutionLabel'>
            HD
        </span>
    );
}
