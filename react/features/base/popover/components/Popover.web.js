/* @flow */

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

import { Drawer, DrawerPortal } from '../../../toolbox/components/web';

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
    return DIALOG_TO_PADDING_POSITION[position.split('-')[0]];
}

/**
 * The type of the React {@code Component} props of {@link Popover}.
 */
type Props = {

    /**
     * A child React Element to use as the trigger for showing the dialog.
     */
    children: React$Node,

    /**
     * Additional CSS classnames to apply to the root of the {@code Popover}
     * component.
     */
    className: string,

    /**
     * The ReactElement to display within the dialog.
     */
    content: Object,

    /**
     * Whether displaying of the popover should be prevented.
     */
    disablePopover: boolean,

    /**
     * An id attribute to apply to the root of the {@code Popover}
     * component.
     */
    id: string,

    /**
    * Callback to invoke when the popover has closed.
    */
    onPopoverClose: Function,

    /**
     * Callback to invoke when the popover has opened.
     */
    onPopoverOpen: Function,

    /**
     * Whether to display the Popover as a drawer.
     */
    overflowDrawer: boolean,

    /**
     * From which side of the dialog trigger the dialog should display. The
     * value will be passed to {@code InlineDialog}.
     */
    position: string
};

/**
 * The type of the React {@code Component} state of {@link Popover}.
 */
type State = {

    /**
     * Whether or not the {@code InlineDialog} should be displayed.
     */
    showDialog: boolean
};

/**
 * Implements a React {@code Component} for showing an {@code InlineDialog} on
 * mouseenter of the trigger and contents, and hiding the dialog on mouseleave.
 *
 * @extends Component
 */
class Popover extends Component<Props, State> {
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
     * Initializes a new {@code Popover} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            showDialog: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onHideDialog = this._onHideDialog.bind(this);
        this._onShowDialog = this._onShowDialog.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._onEscKey = this._onEscKey.bind(this);
        this._onThumbClick = this._onThumbClick.bind(this);
    }

    /**
     * Public method for triggering showing the context menu dialog.
     *
     * @returns {void}
     * @public
     */
    showDialog() {
        this.setState({ showDialog: true });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, className, content, id, overflowDrawer, position } = this.props;

        if (overflowDrawer) {
            return (
                <div
                    className = { className }
                    id = { id }
                    onClick = { this._onShowDialog }>
                    { children }
                    <DrawerPortal>
                        <Drawer
                            isOpen = { this.state.showDialog }
                            onClose = { this._onHideDialog }>
                            { content }
                        </Drawer>
                    </DrawerPortal>
                </div>
            );
        }

        return (
            <div
                className = { className }
                id = { id }
                onClick = { this._onThumbClick }
                onKeyPress = { this._onKeyPress }
                onMouseEnter = { this._onShowDialog }
                onMouseLeave = { this._onHideDialog }>
                <InlineDialog
                    content = { this._renderContent() }
                    isOpen = { this.state.showDialog }
                    placement = { position }>
                    { children }
                </InlineDialog>
            </div>
        );
    }

    _onHideDialog: () => void;

    /**
     * Stops displaying the {@code InlineDialog}.
     *
     * @private
     * @returns {void}
     */
    _onHideDialog() {
        this.setState({ showDialog: false });

        if (this.props.onPopoverClose) {
            this.props.onPopoverClose();
        }
    }

    _onShowDialog: (Object) => void;

    /**
     * Displays the {@code InlineDialog} and calls any registered onPopoverOpen
     * callbacks.
     *
     * @param {Object} event - The mouse event or the keypress event to intercept.
     * @private
     * @returns {void}
     */
    _onShowDialog(event) {
        event.stopPropagation();
        if (!this.props.disablePopover) {
            this.setState({ showDialog: true });

            if (this.props.onPopoverOpen) {
                this.props.onPopoverOpen();
            }
        }
    }

    _onThumbClick: (Object) => void;

    /**
     * Prevents switching from tile view to stage view on accidentally clicking
     * the popover thumbs.
     *
     * @param {Object} event - The mouse event or the keypress event to intercept.
     * @private
     * @returns {void}
     */
    _onThumbClick(event) {
        event.stopPropagation();
    }

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (this.state.showDialog) {
                this._onHideDialog();
            } else {
                this._onShowDialog(e);
            }
        }
    }

    _onEscKey: (Object) => void;

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEscKey(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            if (this.state.showDialog) {
                this._onHideDialog();
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
            <div
                className = 'popover'
                onKeyDown = { this._onEscKey }>
                { content }
                <div className = 'popover-mouse-padding-top' />
                <div className = { _mapPositionToPaddingClass(position) } />
            </div>
        );
    }
}

export default Popover;
