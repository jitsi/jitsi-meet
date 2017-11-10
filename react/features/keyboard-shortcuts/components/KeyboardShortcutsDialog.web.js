import Lozenge from '@atlaskit/lozenge';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

/**
 * Implements a React {@link Component} which displays a dialog describing
 * registered keyboard shortcuts.
 *
 * @extends Component
 */
class KeyboardShortcutsDialog extends Component {
    /**
     * {@code KeyboardShortcutsDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * A Map with keyboard keys as keys and translation keys as values.
         */
        shortcutDescriptions: PropTypes.object,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const shortcuts = Array.from(this.props.shortcutDescriptions)
            .map(description => this._renderShortcutsListItem(...description));

        return (
            <Dialog
                cancelTitleKey = { 'dialog.close' }
                submitDisabled = { true }
                titleKey = 'keyboardShortcuts.keyboardShortcuts'
                width = 'small'>
                <div
                    id = 'keyboard-shortcuts'>
                    <ul
                        className = 'shortcuts-list'
                        id = 'keyboard-shortcuts-list'>
                        { shortcuts }
                    </ul>
                </div>
            </Dialog>
        );
    }

    /**
     * Creates a {@code ReactElement} for describing a single keyboard shortcut.
     *
     * @param {string} keyboardKey - The keyboard key that triggers an action.
     * @param {string} translationKey - A description of what the action does.
     * @private
     * @returns {ReactElement}
     */
    _renderShortcutsListItem(keyboardKey, translationKey) {
        return (
            <li
                className = 'shortcuts-list__item'
                key = { keyboardKey }>
                <span className = 'shortcuts-list__description'>
                    { this.props.t(translationKey) }
                </span>
                <span className = 'item-action'>
                    <Lozenge isBold = { true }>
                        { keyboardKey }
                    </Lozenge>
                </span>
            </li>
        );
    }
}

export default translate(KeyboardShortcutsDialog);
