// @flow

import React from 'react';
import { Icon } from '../../../../base/icons';

/**
 * The type of the React {@code Component} props of {@link AudioSettingsHeader}.
 */
type Props = {

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
export default function AudioSettingsHeader({ IconComponent, text }: Props) {
    return (
        <div className = 'audio-preview-header'>
            <div className = 'audio-preview-header-icon'>
                { <Icon
                    color = '#A4B8D1'
                    size = { 24 }
                    src = { IconComponent } />}
            </div>
            <div className = 'audio-preview-header-text'>{text}</div>
        </div>
    );
}
