import Spinner from '@atlaskit/spinner';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import DesktopSourcePreview from './DesktopSourcePreview';

/**
 * React component for showing a grid of DesktopSourcePreviews.
 *
 * @extends Component
 */
class DesktopPickerPane extends Component {
    /**
     * DesktopPickerPane component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The handler to be invoked when a DesktopSourcePreview is clicked.
         */
        onClick: PropTypes.func,

        /**
         * The handler to be invoked when a DesktopSourcePreview is double
         * clicked.
         */
        onDoubleClick: PropTypes.func,

        /**
         * The id of the DesktopCapturerSource that is currently selected.
         */
        selectedSourceId: PropTypes.string,

        /**
         * An array of DesktopCapturerSources.
         */
        sources: PropTypes.array,

        /**
         * The source type of the DesktopCapturerSources to display.
         */
        type: PropTypes.string
    };

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
