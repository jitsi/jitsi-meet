import React, { Component, ReactNode } from 'react';
import ReactFocusLock from 'react-focus-lock';

import { IReduxState } from '../../../app/types';
import DialogPortal from '../../../toolbox/components/web/DialogPortal';
import Drawer from '../../../toolbox/components/web/Drawer';
import JitsiPortal from '../../../toolbox/components/web/JitsiPortal';
import { isMobileBrowser } from '../../environment/utils';
import { connect } from '../../redux/functions';
import { getContextMenuStyle } from '../functions.web';

/**
 * The type of the React {@code Component} props of {@link Popover}.
 */
interface IProps {

    /**
     * A child React Element to use as the trigger for showing the dialog.
     */
    children: ReactNode;

    /**
     * Additional CSS classnames to apply to the root of the {@code Popover}
     * component.
     */
    className?: string;

    /**
     * The ReactElement to display within the dialog.
     */
    content: ReactNode;

    /**
     * Whether displaying of the popover should be prevented.
     */
    disablePopover?: boolean;

    /**
     * The id of the dom element acting as the Popover label (matches aria-labelledby).
     */
    headingId?: string;

    /**
     * String acting as the Popover label (matches aria-label).
     *
     * If headingId is set, this will not be used.
     */
    headingLabel?: string;

    /**
     * An id attribute to apply to the root of the {@code Popover}
     * component.
     */
    id?: string;

    /**
    * Callback to invoke when the popover has closed.
    */
    onPopoverClose: Function;

    /**
     * Callback to invoke when the popover has opened.
     */
    onPopoverOpen?: Function;

    /**
     * Whether to display the Popover as a drawer.
     */
    overflowDrawer?: boolean;

    /**
     * Where should the popover content be placed.
     */
    position: string;

    /**
     * Whether the trigger for open/ close should be click or hover.
     */
    trigger?: 'hover' | 'click';

    /**
     * Whether the popover is visible or not.
     */
    visible: boolean;
}

/**
 * The type of the React {@code Component} state of {@link Popover}.
 */
interface IState {

    /**
     * The style to apply to the context menu in order to position it correctly.
     */
    contextMenuStyle?: {
        bottom?: string;
        left?: string;
        position: string;
        top?: string;
    } | null;
}

/**
 * Implements a React {@code Component} for showing an {@code Popover} on
 * mouseenter of the trigger and contents, and hiding the dialog on mouseleave.
 *
 * @augments Component
 */
class Popover extends Component<IProps, IState> {
    /**
     * Default values for {@code Popover} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: '',
        id: '',
        trigger: 'hover'
    };

    /**
     * Reference to the dialog container.
     */
    _containerRef: React.RefObject<HTMLDivElement>;

    _contextMenuRef: HTMLElement;

    /**
     * Initializes a new {@code Popover} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
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
        this._onClick = this._onClick.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._setContextMenuRef = this._setContextMenuRef.bind(this);
        this._setContextMenuStyle = this._setContextMenuStyle.bind(this);
        this._getCustomDialogStyle = this._getCustomDialogStyle.bind(this);
        this._onOutsideClick = this._onOutsideClick.bind(this);
    }

    /**
     * Sets up a touch event listener to attach.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        window.addEventListener('touchstart', this._onTouchStart);
        if (this.props.trigger === 'click') {
            // @ts-ignore
            window.addEventListener('click', this._onOutsideClick);
        }
    }

    /**
     * Removes the listener set up in the {@code componentDidMount} method.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        window.removeEventListener('touchstart', this._onTouchStart);
        if (this.props.trigger === 'click') {
            // @ts-ignore
            window.removeEventListener('click', this._onOutsideClick);
        }
    }

    /**
     * Handles click outside the popover.
     *
     * @param {MouseEvent} e - The click event.
     * @returns {void}
     */
    _onOutsideClick(e: React.MouseEvent) { // @ts-ignore
        if (!this._containerRef?.current?.contains(e.target) && this.props.visible) {
            this._onHideDialog();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children,
            className,
            content,
            headingId,
            headingLabel,
            id,
            overflowDrawer,
            visible,
            trigger
        } = this.props;

        if (overflowDrawer) {
            return (
                <div
                    className = { className }
                    id = { id }
                    onClick = { this._onShowDialog }>
                    { children }
                    <JitsiPortal>
                        <Drawer
                            headingId = { headingId }
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
                onClick = { this._onClick }
                onKeyPress = { this._onKeyPress }
                { ...(trigger === 'hover' ? {
                    onMouseEnter: this._onShowDialog,
                    onMouseLeave: this._onHideDialog,
                    tabIndex: 0
                } : {}) }
                ref = { this._containerRef }>
                { visible && (
                    <DialogPortal
                        getRef = { this._setContextMenuRef }
                        setSize = { this._setContextMenuStyle }
                        style = { this.state.contextMenuStyle }>
                        <ReactFocusLock
                            lockProps = {{
                                role: 'dialog',
                                'aria-modal': true,
                                'aria-labelledby': headingId,
                                'aria-label': !headingId && headingLabel ? headingLabel : undefined
                            }}
                            returnFocus = { true }>
                            {this._renderContent()}
                        </ReactFocusLock>
                    </DialogPortal>
                )}
                { children }
            </div>
        );
    }

    /**
     * Sets the context menu dialog style for positioning it on screen.
     *
     * @param {DOMRectReadOnly} size -The size info of the current context menu.
     *
     * @returns {void}
     */
    _setContextMenuStyle(size: DOMRectReadOnly) {
        const style = this._getCustomDialogStyle(size);

        this.setState({ contextMenuStyle: style });
    }

    /**
     * Sets the context menu's ref.
     *
     * @param {HTMLElement} elem -The html element of the context menu.
     *
     * @returns {void}
     */
    _setContextMenuRef(elem: HTMLElement) {
        this._contextMenuRef = elem;
    }

    /**
     * Hide dialog on touch outside of the context menu.
     *
     * @param {TouchEvent} event - The touch event.
     * @private
     * @returns {void}
     */
    _onTouchStart(event: TouchEvent) {
        if (this.props.visible
            && !this.props.overflowDrawer
            && this._contextMenuRef
            && this._contextMenuRef.contains // @ts-ignore
            && !this._contextMenuRef.contains(event.target)) {
            this._onHideDialog();
        }
    }

    /**
     * Stops displaying the {@code Popover}.
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

    /**
     * Displays the {@code Popover} and calls any registered onPopoverOpen
     * callbacks.
     *
     * @param {Object} event - The mouse event or the keypress event to intercept.
     * @private
     * @returns {void}
     */
    _onShowDialog(event?: React.MouseEvent | React.KeyboardEvent) {
        event?.stopPropagation();

        if (!this.props.disablePopover) {
            this.props.onPopoverOpen?.();
        }
    }

    /**
     * Prevents switching from tile view to stage view on accidentally clicking
     * the popover thumbs.
     *
     * @param {Object} event - The mouse event or the keypress event to intercept.
     * @private
     * @returns {void}
     */
    _onClick(event: React.MouseEvent) {
        const { trigger, visible } = this.props;

        event.stopPropagation();
        if (trigger === 'click') {
            if (visible) {
                this._onHideDialog();
            } else {
                this._onShowDialog();
            }
        }
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (this.props.visible) {
                this._onHideDialog();
            } else {
                this._onShowDialog(e);
            }
        }
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onEscKey(e: React.KeyboardEvent) {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            if (this.props.visible) {
                this._onHideDialog();
            }
        }
    }

    /**
     * Gets style for positioning the context menu on screen in regards to the trigger's
     * position.
     *
     * @param {DOMRectReadOnly} size -The current context menu's size info.
     *
     * @returns {Object} - The new style of the context menu.
     */
    _getCustomDialogStyle(size: DOMRectReadOnly) {
        if (this._containerRef?.current) {
            const bounds = this._containerRef.current.getBoundingClientRect();

            return getContextMenuStyle(bounds, size, this.props.position);
        }
    }

    /**
     * Renders the React Element to be displayed in the {@code Popover}.
     * Also adds padding to support moving the mouse from the trigger to the
     * dialog to prevent mouseleave events.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderContent() {
        const { content } = this.props;

        return (
            <div
                className = 'popover'
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
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        overflowDrawer: state['features/toolbox'].overflowDrawer
    };
}

export default connect(_mapStateToProps)(Popover);
