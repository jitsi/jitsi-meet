import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React from 'react';
import { WithTranslation } from 'react-i18next';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps } from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Checkbox from '../../../base/ui/components/web/Checkbox';

/**
 * The type of the React {@code Component} props of {@link ShortcutsTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes: any;

    /**
     * Whether to display the shortcuts or not.
     */
    displayShortcuts: boolean;

    /**
     * Wether the keyboard shortcuts are enabled or not.
     */
    keyboardShortcutsEnabled: boolean;

    /**
     * The keyboard shortcuts descriptions.
     */
    keyboardShortcutsHelpDescriptions: Map<string, string>;
}

const styles = (theme: Theme) => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column' as const,
            width: '100%',
            paddingBottom: theme.spacing(3)
        },

        checkbox: {
            marginBottom: theme.spacing(3)
        },

        listContainer: {
            listStyleType: 'none',
            padding: 0,
            margin: 0
        },

        listItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${theme.spacing(1)} 0`,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            color: theme.palette.text01
        },

        listItemKey: {
            backgroundColor: theme.palette.ui04,
            ...withPixelLineHeight(theme.typography.labelBold),
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
            borderRadius: `${Number(theme.shape.borderRadius) / 2}px`
        }
    };
};

/**
 * React {@code Component} for modifying the local user's profile.
 *
 * @augments Component
 */
class ShortcutsTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code MoreTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onKeyboardShortcutEnableChanged = this._onKeyboardShortcutEnableChanged.bind(this);
        this._renderShortcutsListItem = this._renderShortcutsListItem.bind(this);
    }

    /**
     * Callback invoked to select if global keyboard shortcuts
     * should be enabled.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyboardShortcutEnableChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ keyboardShortcutsEnabled: checked });
    }

    /**
     * Render a keyboard shortcut with key and description.
     *
     * @param {string} keyboardKey - The keyboard key for the shortcut.
     * @param {string} translationKey - The translation key for the shortcut description.
     * @returns {JSX}
     */
    _renderShortcutsListItem(keyboardKey: string, translationKey: string) {
        const { classes, t } = this.props;
        let modifierKey = 'Alt';

        if (window.navigator?.platform) {
            if (window.navigator.platform.indexOf('Mac') !== -1) {
                modifierKey = '⌥';
            }
        }

        return (
            <li
                className = { classes.listItem }
                key = { keyboardKey }>
                <span
                    aria-label = { t(translationKey) }>
                    {t(translationKey)}
                </span>
                <span className = { classes.listItemKey }>
                    {keyboardKey.startsWith(':')
                        ? `${modifierKey} + ${keyboardKey.slice(1)}`
                        : keyboardKey}
                </span>
            </li>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            classes,
            displayShortcuts,
            keyboardShortcutsHelpDescriptions,
            keyboardShortcutsEnabled,
            t
        } = this.props;
        const shortcutDescriptions: Map<string, string> = displayShortcuts
            ? keyboardShortcutsHelpDescriptions
            : new Map();

        return (
            <div className = { classes.container }>
                <Checkbox
                    checked = { keyboardShortcutsEnabled }
                    className = { classes.checkbox }
                    label = { t('prejoin.keyboardShortcuts') }
                    name = 'enable-keyboard-shortcuts'
                    onChange = { this._onKeyboardShortcutEnableChanged } />
                {displayShortcuts && (
                    <ul className = { classes.listContainer }>
                        {Array.from(shortcutDescriptions)
                            .map(description => this._renderShortcutsListItem(...description))}
                    </ul>
                )}
            </div>
        );
    }
}

export default withStyles(styles)(translate(ShortcutsTab));
