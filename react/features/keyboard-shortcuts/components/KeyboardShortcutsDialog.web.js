/* @flow */

import Lozenge from '@atlaskit/lozenge';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

/**
 * The type of the React {@code Component} props of
 * {@link KeyboardShortcutsDialog}.
 */
type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * A Map with keyboard keys as keys and translation keys as values.
     */
    shortcutDescriptions: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        list: {
            listStyleType: 'none',
            padding: 0,

            '& .shortcuts-list__item': {
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing(2)
            }
        }
    };
};

/**
 * Implements a React {@link Component} which displays a dialog describing
 * registered keyboard shortcuts.
 *
 * @augments Component
 */
class KeyboardShortcutsDialog extends Component<Props> {
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
                cancelKey = { 'dialog.close' }
                submitDisabled = { true }
                titleKey = 'keyboardShortcuts.keyboardShortcuts'
                width = 'small'>
                <div
                    id = 'keyboard-shortcuts'>
                    <ul
                        className = { clsx('shortcuts-list', this.props.classes.list) }
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
        let modifierKey = 'Alt';

        if (window.navigator?.platform) {
            if (window.navigator.platform.indexOf('Mac') !== -1) {
                modifierKey = '⌥';
            }
        }

        return (
            <li
                className = 'shortcuts-list__item'
                key = { keyboardKey }>
                <span
                    aria-label = { this.props.t(translationKey) }
                    className = 'shortcuts-list__description'>
                    { this.props.t(translationKey) }
                </span>
                <span className = 'item-action'>
                    <Lozenge isBold = { true }>
                        { keyboardKey.startsWith(':')
                            ? `${modifierKey} + ${keyboardKey.slice(1)}`
                            : keyboardKey }
                    </Lozenge>
                </span>
            </li>
        );
    }
}

export default translate(withStyles(styles)(KeyboardShortcutsDialog));
