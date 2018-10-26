import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * A map of dialog positions, relative to trigger, to css classes used to
 * manipulate elements for handling mouse events.
 *
 * @private
 * @type {object}
 */
const DIALOG_TO_PADDING_POSITION = {
    'left': 'popover-mousemove-padding-right',
    'right': 'popover-mousemove-padding-left',
    'top': 'popover-mousemove-padding-bottom'
};

/**
 * Takes the position expected by {@code InlineDialog} and maps it to a CSS
 * class that can be used styling the elements used for preventing mouseleave
 * events when moving from the trigger to the dialog.
 *
 * @param {string} position - From which position the dialog will display.
 * @private
 * @returns {string}
 */
function _mapPositionToPaddingClass(position = 'left') {
    return DIALOG_TO_PADDING_POSITION[position.split(' ')[0]];
}

/**
 * Implements a React {@code Component} for showing an {@code InlineDialog} on
 * mouseenter of the trigger and contents, and hiding the dialog on mouseleave.
 *
 * @extends Component
 */
class Popover extends Component {
    /**
     * Default values for {@code Popover} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: '',
        id: ''
    };

    /**
     * {@code Popover} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * A child React Element to use as the trigger for showing the dialog.
         */
        children: PropTypes.object,

        /**
         * Additional CSS classnames to apply to the root of the {@code Popover}
         * component.
         */
        className: PropTypes.string,

        /**
         * The ReactElement to display within the dialog.
         */
        content: PropTypes.object,

        /**
         * Whether displaying of the popover should be prevented.
         */
        disablePopover: PropTypes.bool,

        /**
         * An id attribute to apply to the root of the {@code Popover}
         * component.
         */
        id: PropTypes.string,

        /**
         * Callback to invoke when the popover has opened.
         */
        onPopoverOpen: PropTypes.func,

        /**
         * From which side of the dialog trigger the dialog should display. The
         * value will be passed to {@code InlineDialog}.
         */
        position: PropTypes.string
    };

    /**
     * Initializes a new {@code Popover} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the {@code InlineDialog} should be displayed.
             *
             * @type {boolean}
             */
            showDialog: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onHideDialog = this._onHideDialog.bind(this);
        this._onShowDialog = this._onShowDialog.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = { this.props.className }
                id = { this.props.id }
                onMouseEnter = { this._onShowDialog }
                onMouseLeave = { this._onHideDialog }>
                <InlineDialog
                    content = { this._renderContent() }
                    isOpen = { this.state.showDialog }
                    position = { this.props.position }>
                    { this.props.children }
                </InlineDialog>
            </div>
        );
    }

    /**
     * Stops displaying the {@code InlineDialog}.
     *
     * @private
     * @returns {void}
     */
    _onHideDialog() {
        this.setState({ showDialog: false });
    }

    /**
     * Displays the {@code InlineDialog} and calls any registered onPopoverOpen
     * callbacks.
     *
     * @private
     * @returns {void}
     */
    _onShowDialog() {
        if (!this.props.disablePopover) {
            this.setState({ showDialog: true });

            if (this.props.onPopoverOpen) {
                this.props.onPopoverOpen();
            }
        }
    }

    /**
     * Renders the React Element to be displayed in the {@code InlineDialog}.
     * Also adds padding to support moving the mouse from the trigger to the
     * dialog to prevent mouseleave events.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderContent() {
        const { content, position } = this.props;

        return (
            <div className = 'popover'>
                { content }
                <div className = 'popover-mouse-padding-top' />
                <div className = { _mapPositionToPaddingClass(position) } />
            </div>
        );
    }
}

export default Popover;
