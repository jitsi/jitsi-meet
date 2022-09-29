import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { hideDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';

/**
 * The type of the React {@code Component} props of
 * {@link KeyboardShortcutsDialog}.
 */
interface Props extends WithTranslation {

    /**
     * Dispatches close dialog.
     */
    _onCloseDialog: () => void;

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * A Map with keyboard keys as keys and translation keys as values.
     */
    shortcutDescriptions: Map<string, string>;
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = (theme: Theme) => {
    return {
        list: {
            listStyleType: 'none',
            padding: 0,

            '& .shortcuts-list__item': {
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing(2)
            },

            '& .item-action': {
                backgroundColor: theme.palette.ui04,
                fontWeight: 'bold',
                padding: '1px 4px',
                borderRadius: '4px'
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
                onCancel = { this.props._onCloseDialog }
                titleKey = 'keyboardShortcuts.keyboardShortcuts'>
                <div
                    id = 'keyboard-shortcuts'>
                    <ul
                        className = { clsx('shortcuts-list', this.props.classes.list) }
                        id = 'keyboard-shortcuts-list'>
                        {shortcuts}
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
    _renderShortcutsListItem(keyboardKey: string, translationKey: string) {
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
                    { keyboardKey.startsWith(':')
                        ? `${modifierKey} + ${keyboardKey.slice(1)}`
                        : keyboardKey }
                </span>
            </li>
        );
    }
}

/**
 * Function that maps parts of Redux actions into component props.
 *
 * @param {Object} dispatch - Redux dispatch.
 * @returns {Object}
 */
function mapDispatchToProps(dispatch: IStore['dispatch']) {
    return {
        _onCloseDialog: () => dispatch(hideDialog())
    };
}

export default connect(null, mapDispatchToProps)(translate(withStyles(styles)(KeyboardShortcutsDialog)));
