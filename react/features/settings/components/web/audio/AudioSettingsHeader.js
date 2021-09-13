// @flow

import React from 'react';

import { Icon } from '../../../../base/icons';

/**
 * The type of the React {@code Component} props of {@link AudioSettingsHeader}.
 */
type Props = {

    /**
     * The id used for the Header-text.
     */
    id?: string,

    /**
     * The Icon used for the Header.
     */
    IconComponent: Function,

    /**
     * The text of the Header.
     */
    text: string,
};

/**
 * React {@code Component} representing the Header of an audio option group.
 *
 * @returns { ReactElement}
 */
export default function AudioSettingsHeader({ IconComponent, id, text }: Props) {
    return (
        <div
            className = 'audio-preview-header'
            role = 'heading'>
            <div className = 'audio-preview-header-icon'>
                { <Icon
                    size = { 20 }
                    src = { IconComponent } />}
            </div>
            <div
                className = 'audio-preview-header-text'
                id = { id } >{text}</div>
        </div>
    );
}
