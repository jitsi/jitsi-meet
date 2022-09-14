/* eslint-disable lines-around-comment */
import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { translate } from '../../../base/i18n/functions';

import HangupToggleButton from './HangupToggleButton';

/**
 * The type of the React {@code Component} props of {@link HangupMenuButton}.
 */
interface Props extends WithTranslation {

    /**
     * ID of the menu that is controlled by this button.
     */
    ariaControls: String;

    /**
     * A child React Element to display within {@code InlineDialog}.
     */
    children: React.ReactNode;

    /**
     * Whether or not the HangupMenu popover should display.
     */
    isOpen: boolean;

    /**
     * Callback to change the visibility of the hangup menu.
     */
    onVisibilityChange: Function;
}

/**
 * A React {@code Component} for opening or closing the {@code HangupMenu}.
 *
 * @augments Component
 */
class HangupMenuButton extends Component<Props> {
    /**
     * Initializes a new {@code HangupMenuButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._toggleDialogVisibility
            = this._toggleDialogVisibility.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
    }

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event: KeyboardEvent) {
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
        const { children, isOpen } = this.props;

        return (
            <div className = 'toolbox-button-wth-dialog context-menu'>
                <InlineDialog
                    content = { children }
                    isOpen = { isOpen }
                    onClose = { this._onCloseDialog }
                    placement = 'top-end'>
                    <HangupToggleButton
                        customClass = 'hangup-menu-button'
                        handleClick = { this._toggleDialogVisibility }
                        isOpen = { isOpen }
                        onKeyDown = { this._onEscClick } />
                </InlineDialog>
            </div>
        );
    }

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

    /**
     * Callback invoked to signal that an event has occurred that should change
     * the visibility of the {@code InlineDialog} component.
     *
     * @private
     * @returns {void}
     */
    _toggleDialogVisibility() {
        sendAnalytics(createToolbarEvent('hangup'));

        this.props.onVisibilityChange(!this.props.isOpen);
    }
}

export default translate(HangupMenuButton);
