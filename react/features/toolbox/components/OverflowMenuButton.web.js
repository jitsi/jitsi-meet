import InlineDialog from '@atlaskit/inline-dialog';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';

import ToolbarButton from './ToolbarButton';

/**
 * A React {@code Component} for opening or closing the {@code OverflowMenu}.
 *
 * @extends Component
 */
class OverflowMenuButton extends Component {
    /**
     * {@code OverflowMenuButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * A child React Element to display within {@code InlineDialog}.
         */
        children: PropTypes.object,

        /**
         * Whether or not the OverflowMenu popover should display.
         */
        isOpen: PropTypes.bool,

        /**
         * Calback to change the visiblility of the overflow menu.
         */
        onVisibilityChange: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code OverflowMenuButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._onToggleDialogVisibility
            = this._onToggleDialogVisibility.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, isOpen, t } = this.props;
        const iconClasses = `icon-thumb-menu ${isOpen ? 'toggled' : ''}`;

        return (
            <div className = 'toolbox-button-wth-dialog'>
                <InlineDialog
                    content = { children }
                    isOpen = { isOpen }
                    onClose = { this._onCloseDialog }
                    position = { 'top right' }>
                    <ToolbarButton
                        accessibilityLabel = 'Overflow'
                        iconName = { iconClasses }
                        onClick = { this._onToggleDialogVisibility }
                        tooltip = { t('toolbar.moreActions') } />
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
    _onToggleDialogVisibility() {
        sendAnalytics(createToolbarEvent('overflow'));

        this.props.onVisibilityChange(!this.props.isOpen);
    }
}

export default translate(OverflowMenuButton);
