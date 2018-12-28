/* @flow */

import Spinner from '@atlaskit/spinner';
import React, { Component } from 'react';

import DesktopSourcePreview from './DesktopSourcePreview';

/**
 * The type of the React {@code Component} props of {@link DesktopPickerPane}.
 */
type Props = {

    /**
     * The handler to be invoked when a DesktopSourcePreview is clicked.
     */
    onClick: Function,

    /**
     * The handler to be invoked when a DesktopSourcePreview is double clicked.
     */
    onDoubleClick: Function,

    /**
     * The id of the DesktopCapturerSource that is currently selected.
     */
    selectedSourceId: string,

    /**
     * An array of DesktopCapturerSources.
     */
    sources: Array<Object>,

    /**
     * The source type of the DesktopCapturerSources to display.
     */
    type: string
};

/**
 * React component for showing a grid of DesktopSourcePreviews.
 *
 * @extends Component
 */
class DesktopPickerPane extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            onClick,
            onDoubleClick,
            selectedSourceId,
            sources,
            type
        } = this.props;

        const classNames
            = `desktop-picker-pane default-scrollbar source-type-${type}`;
        const previews
            = sources
                ? sources.map(source => (
                    <DesktopSourcePreview
                        key = { source.id }
                        onClick = { onClick }
                        onDoubleClick = { onDoubleClick }
                        selected = { source.id === selectedSourceId }
                        source = { source }
                        type = { type } />))
                : (
                    <div className = 'desktop-picker-pane-spinner'>
                        <Spinner
                            isCompleting = { false }
                            size = 'medium' />
                    </div>
                );

        return (
            <div className = { classNames }>
                { previews }
            </div>
        );
    }
}

export default DesktopPickerPane;
