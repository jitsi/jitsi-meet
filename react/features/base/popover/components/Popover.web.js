/* @flow */
import clsx from 'clsx';
import React, { Component } from 'react';

import { Drawer, JitsiPortal, DialogPortal } from '../../../toolbox/components/web';
import { isMobileBrowser } from '../../environment/utils';
import { connect } from '../../redux';
import { getContextMenuStyle } from '../functions.web';

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
    position: string,

    /**
     * Whether the content show have some padding.
     */
    paddedContent: ?boolean,

    /**
     * Whether the popover is visible or not.
     */
    visible: boolean
};

/**
 * The type of the React {@code Component} state of {@link Popover}.
 */
type State = {

    /**
     * The style to apply to the context menu in order to position it correctly.
     */
     contextMenuStyle: Object
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
     * Reference to the dialog container.
     */
    _containerRef: Object;

    _contextMenuRef: HTMLElement;

    /**
     * Initializes a new {@code Popover} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            contextMenuStyle: null
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onHideDialog = this._onHideDialog.bind(this);
        this._onShowDialog = this._onShowDialog.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._containerRef = React.createRef();
        this._onEscKey = this._onEscKey.bind(this);
        this._onThumbClick = this._onThumbClick.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._setContextMenuRef = this._setContextMenuRef.bind(this);
        this._setContextMenuStyle = this._setContextMenuStyle.bind(this);
        this._getCustomDialogStyle = this._getCustomDialogStyle.bind(this);
    }

    /**
     * Sets up a touch event listener to attach.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        window.addEventListener('touchstart', this._onTouchStart);
    }

    /**
     * Removes the listener set up in the {@code componentDidMount} method.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        window.removeEventListener('touchstart', this._onTouchStart);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, className, content, id, overflowDrawer, visible } = this.props;

        if (overflowDrawer) {
            return (
                <div
                    className = { className }
                    id = { id }
                    onClick = { this._onShowDialog }>
                    { children }
                    <JitsiPortal>
                        <Drawer
                            isOpen = { visible }
                            onClose = { this._onHideDialog }>
                            { content }
                        </Drawer>
                    </JitsiPortal>
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
                onMouseLeave = { this._onHideDialog }
                ref = { this._containerRef }>
                { visible && (
                    <DialogPortal
                        getRef = { this._setContextMenuRef }
                        setSize = { this._setContextMenuStyle }
                        style = { this.state.contextMenuStyle }>
                        {this._renderContent()}
                    </DialogPortal>
                )}
                { children }
            </div>
        );
    }

    _setContextMenuStyle: (size: Object) => void;

    /**
     * Sets the context menu dialog style for positioning it on screen.
     *
     * @param {DOMRectReadOnly} size -The size info of the current context menu.
     *
     * @returns {void}
     */
    _setContextMenuStyle(size) {
        const style = this._getCustomDialogStyle(size);

        this.setState({ contextMenuStyle: style });
    }

    _setContextMenuRef: (elem: HTMLElement) => void;

    /**
     * Sets the context menu's ref.
     *
     * @param {HTMLElement} elem -The html element of the context menu.
     *
     * @returns {void}
     */
    _setContextMenuRef(elem) {
        this._contextMenuRef = elem;
    }

    _onTouchStart: (event: TouchEvent) => void;

    /**
     * Hide dialog on touch outside of the context menu.
     *
     * @param {TouchEvent} event - The touch event.
     * @private
     * @returns {void}
     */
    _onTouchStart(event) {
        if (this.props.visible
            && !this.props.overflowDrawer
            && this._contextMenuRef
            && this._contextMenuRef.contains
            && !this._contextMenuRef.contains(event.target)) {
            this._onHideDialog();
        }
    }

    _onHideDialog: () => void;

    /**
     * Stops displaying the {@code InlineDialog}.
     *
     * @private
     * @returns {void}
     */
    _onHideDialog() {
        this.setState({
            contextMenuStyle: null
        });

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
        event && event.stopPropagation();

        if (!this.props.disablePopover) {
            this.props.onPopoverOpen();
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
            if (this.props.visible) {
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
            if (this.props.visible) {
                this._onHideDialog();
            }
        }
    }

    _getCustomDialogStyle: (DOMRectReadOnly) => void;

    /**
     * Gets style for positioning the context menu on screen in regards to the trigger's
     * position.
     *
     * @param {DOMRectReadOnly} size -The current context menu's size info.
     *
     * @returns {Object} - The new style of the context menu.
     */
    _getCustomDialogStyle(size) {
        if (this._containerRef && this._containerRef.current) {
            const bounds = this._containerRef.current.getBoundingClientRect();

            return getContextMenuStyle(bounds, size, this.props.position);
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
        const { content, paddedContent } = this.props;
        const className = clsx(
            'popover popupmenu',
            paddedContent && 'padded-content'
        );

        return (
            <div
                className = { className }
                onKeyDown = { this._onEscKey }>
                { content }
                {!isMobileBrowser() && (
                    <>
                        <div className = 'popover-mousemove-padding-top' />
                        <div className = 'popover-mousemove-padding-right' />
                        <div className = 'popover-mousemove-padding-left' />
                        <div className = 'popover-mousemove-padding-bottom' />
                    </>)}
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Popover}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        overflowDrawer: state['features/toolbox'].overflowDrawer
    };
}

export default connect(_mapStateToProps)(Popover);
