import React, { Component } from 'react';

/**
 * React component for displaying a preview of a DesktopCapturerSource.
 *
 * @extends Component
 */
class DesktopSourcePreview extends Component {
    /**
     * DesktopSourcePreview component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The callback to invoke when the component is clicked. The id of
         * the DesktopCapturerSource will be passed in.
         */
        onClick: React.PropTypes.func,

        /**
         * The callback to invoke when the component is double clicked. The id
         * of the DesktopCapturerSource will be passed in.
         */
        onDoubleClick: React.PropTypes.func,

        /**
         * The indicator which determines whether this DesktopSourcePreview is
         * selected. If true, the 'is-selected' CSS class will be added to the
         * Component.
         */
        selected: React.PropTypes.bool,

        /**
         * The DesktopCapturerSource to display.
         */
        source: React.PropTypes.object,

        /**
         * The source type of the DesktopCapturerSources to display.
         */
        type: React.PropTypes.string
    };

    /**
     * Initializes a new DesktopSourcePreview instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onClick = this._onClick.bind(this);
        this._onDoubleClick = this._onDoubleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const selectedClass = this.props.selected ? 'is-selected' : '';
        const displayClasses = `desktop-picker-source ${selectedClass}`;

        return (
            <div
                className = { displayClasses }
                onClick = { this._onClick }
                onDoubleClick = { this._onDoubleClick }>
                <div className = 'desktop-source-preview-image-container'>
                    <img
                        className = 'desktop-source-preview-thumbnail'
                        src = { this.props.source.thumbnail.toDataURL() } />
                </div>
                <div className = 'desktop-source-preview-label'>
                    { this.props.source.name }
                </div>
            </div>
        );
    }

    /**
     * Invokes the passed in onClick callback.
     *
     * @returns {void}
     */
    _onClick() {
        const { source, type } = this.props;

        this.props.onClick(source.id, type);
    }

    /**
     * Invokes the passed in onDoubleClick callback.
     *
     * @returns {void}
     */
    _onDoubleClick() {
        const { source, type } = this.props;

        this.props.onDoubleClick(source.id, type);
    }
}

export default DesktopSourcePreview;
