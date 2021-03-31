/* @flow */

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconHorizontalPoints } from '../../../base/icons';
import { connect } from '../../../base/redux';

import Drawer from './Drawer';
import DrawerPortal from './DrawerPortal';
import ToolbarButton from './ToolbarButton';

/**
 * The type of the React {@code Component} props of {@link OverflowMenuButton}.
 */
type Props = {

    /**
     * ID of the menu that is controlled by this button.
     */
    ariaControls: String,

    /**
     * A child React Element to display within {@code InlineDialog}.
     */
    children: React$Node,

    /**
     * Whether or not the OverflowMenu popover should display.
     */
    isOpen: boolean,

    /**
     * Callback to change the visibility of the overflow menu.
     */
    onVisibilityChange: Function,

    /**
     * Whether to display the OverflowMenu as a drawer.
     */
    overflowDrawer: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * A React {@code Component} for opening or closing the {@code OverflowMenu}.
 *
 * @extends Component
 */
class OverflowMenuButton extends Component<Props> {
    /**
     * Initializes a new {@code OverflowMenuButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._onToggleDialogVisibility
            = this._onToggleDialogVisibility.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
    }

    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props.isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onCloseDialog();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, isOpen, overflowDrawer } = this.props;

        return (
            <div className = 'toolbox-button-wth-dialog'>
                {
                    overflowDrawer ? (
                        <>
                            {this._renderToolbarButton()}
                            <DrawerPortal>
                                <Drawer
                                    canExpand = { true }
                                    isOpen = { isOpen }
                                    onClose = { this._onCloseDialog }>
                                    {children}
                                </Drawer>
                            </DrawerPortal>
                        </>
                    ) : (
                        <InlineDialog
                            content = { children }
                            isOpen = { isOpen }
                            onClose = { this._onCloseDialog }
                            placement = 'top-end'>
                            {this._renderToolbarButton()}
                        </InlineDialog>
                    )
                }
            </div>
        );
    }

    _renderToolbarButton: () => React$Node;

    /**
     * Renders the actual toolbar overflow menu button.
     *
     * @returns {ReactElement}
     */
    _renderToolbarButton() {
        const { ariaControls, isOpen, t } = this.props;

        return (
            <ToolbarButton
                accessibilityLabel =
                    { t('toolbar.accessibilityLabel.moreActions') }
                aria-controls = { ariaControls }
                aria-haspopup = 'true'
                icon = { IconHorizontalPoints }
                onClick = { this._onToggleDialogVisibility }
                onKeyDown = { this._onEscClick }
                toggled = { isOpen }
                tooltip = { t('toolbar.moreActions') } />
        );
    }

    _onCloseDialog: () => void;

    /**
     * Callback invoked when {@code InlineDialog} signals that it should be
     * close.
     *
     * @private
     * @returns {void}
     */
    _onCloseDialog() {
        this.props.onVisibilityChange(false);
    }

    _onToggleDialogVisibility: () => void;

    /**
     * Callback invoked to signal that an event has occurred that should change
     * the visibility of the {@code InlineDialog} component.
     *
     * @private
     * @returns {void}
     */
    _onToggleDialogVisibility() {
        sendAnalytics(createToolbarEvent('overflow'));

        this.props.onVisibilityChange(!this.props.isOpen);
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code OverflowMenuButton} component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { overflowDrawer } = state['features/toolbox'];

    return {
        overflowDrawer
    };
}

export default translate(connect(mapStateToProps)(OverflowMenuButton));
