// @flow

import React from 'react';

import { Icon, IconCheck, IconExclamationSolid } from '../../../../base/icons';

/**
 * The type of the React {@code Component} props of {@link AudioSettingsEntry}.
 */
export type Props = {

    /**
     * The text for this component.
     */
    children: React$Node,

    /**
     * Flag indicating an error.
     */
    hasError?: boolean,

    /**
     * Flag indicating the selection state.
     */
    isSelected: boolean,
};

/**
 * React {@code Component} representing an entry for the audio settings.
 *
 * @returns { ReactElement}
 */
export default function AudioSettingsEntry({ children, hasError, isSelected }: Props) {
    const className = `audio-preview-entry ${isSelected
        ? 'audio-preview-entry--selected' : ''}`;

    return (
        <div className = { className }>
            {isSelected && (
                <Icon
                    className = 'audio-preview-icon audio-preview-icon--check'
                    color = '#1C2025'
                    size = { 14 }
                    src = { IconCheck } />
            )}
            <span className = 'audio-preview-entry-text'>{children}</span>
            {hasError && <Icon
                className = 'audio-preview-icon audio-preview-icon--exclamation'
                size = { 16 }
                src = { IconExclamationSolid } />}
        </div>
    );
}
