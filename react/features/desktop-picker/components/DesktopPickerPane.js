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
        onClick: React.PropTypes.func,

        /**
         * The handler to be invoked when a DesktopSourcePreview is
         * double clicked.
         */
        onDoubleClick: React.PropTypes.func,

        /**
         * The id of the DesktopCapturerSource that is currently selected.
         */
        selectedSourceId: React.PropTypes.string,

        /**
         * An array of DesktopCapturerSources.
         */
        sources: React.PropTypes.array,

        /**
         * The source type of the DesktopCapturerSources to display.
         */
        type: React.PropTypes.string
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const previews = this.props.sources.map(source =>
            <DesktopSourcePreview
                isSelected = { source.id === this.props.selectedSourceId }
                key = { source.id }
                onClick = { this.props.onClick }
                onDoubleClick = { this.props.onDoubleClick }
                source = { source } />
        );
        const classnames = 'desktop-picker-pane default-scrollbar '
            + `source-type-${this.props.type}`;

        return (
            <div className = { classnames }>
                { previews }
            </div>
        );
    }
}

export default DesktopPickerPane;
