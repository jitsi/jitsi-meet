import { Theme } from '@mui/material';
import React from 'react';
import { WithTranslation } from 'react-i18next';
import { withStyles } from 'tss-react/mui';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps } from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import Checkbox from '../../../base/ui/components/web/Checkbox';

/**
 * The type of the React {@code Component} props of {@link ShortcutsTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * Whether Ctrl+Alt aliases for reaction shortcuts are enabled or not.
     */
    ctrlAltReactionShortcutsEnabled: boolean;

    /**
     * Whether to display the shortcuts or not.
     */
    displayShortcuts: boolean;

    /**
     * Whether the keyboard shortcuts are enabled or not.
     */
    keyboardShortcutsEnabled: boolean;

    /**
     * The keyboard shortcuts descriptions.
     */
    keyboardShortcutsHelpDescriptions: Map<string, string>;

    /**
     * Whether the Ctrl+Alt reaction shortcut setting should be displayed.
     */
    showCtrlAltReactionShortcuts: boolean;
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
            ...theme.typography.bodyShortRegular,
            color: theme.palette.settingsTabText
        },

        listItemKey: {
            backgroundColor: theme.palette.settingsShortcutKey,
            ...theme.typography.labelBold,
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
            borderRadius: `${Number(theme.shape.borderRadius) / 2}px`,
            whiteSpace: 'nowrap' as const
        },

        listItemKeys: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: theme.spacing(1),
            justifyContent: 'flex-end'
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
        this._onCtrlAltReactionShortcutsEnableChanged
            = this._onCtrlAltReactionShortcutsEnableChanged.bind(this);
        this._onKeyboardShortcutEnableChanged = this._onKeyboardShortcutEnableChanged.bind(this);
        this._renderShortcutsListItem = this._renderShortcutsListItem.bind(this);
    }

    /**
     * Callback invoked to select if Ctrl+Alt reaction shortcut aliases should be enabled.
     *
     * @param {Object} e - The change event to handle.
     * @returns {void}
     */
    _onCtrlAltReactionShortcutsEnableChanged({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        super._onChange({ ctrlAltReactionShortcutsEnabled: checked });
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
     * @param {string[]} keyboardKeys - The keyboard keys for the shortcut.
     * @param {string} translationKey - The translation key for the shortcut description.
     * @returns {JSX}
     */
    _renderShortcutsListItem(keyboardKeys: string[], translationKey: string) {
        const { t } = this.props;
        const classes = withStyles.getClasses(this.props);
        let modifierKey = 'Alt';

        if (window.navigator?.platform) {
            if (window.navigator.platform.indexOf('Mac') !== -1) {
                modifierKey = '⌥';
            }
        }

        return (
            <li
                className = { classes.listItem }
                key = { translationKey }>
                <span
                    aria-label = { t(translationKey) }>
                    {t(translationKey)}
                </span>
                <span className = { classes.listItemKeys }>
                    {keyboardKeys.map(keyboardKey => {
                        let formattedKey = keyboardKey;

                        if (keyboardKey.startsWith('-:')) {
                            formattedKey = `Ctrl + ${modifierKey} + ${keyboardKey.slice(2)}`;
                        } else if (keyboardKey.startsWith(':')) {
                            formattedKey = `${modifierKey} + ${keyboardKey.slice(1)}`;
                        } else if (keyboardKey.startsWith('-')) {
                            formattedKey = `Ctrl + ${keyboardKey.slice(1)}`;
                        }

                        return (
                            <span
                                className = { classes.listItemKey }
                                key = { keyboardKey }>
                                {formattedKey}
                            </span>
                        );
                    })}
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
    override render() {
        const {
            ctrlAltReactionShortcutsEnabled,
            displayShortcuts,
            keyboardShortcutsHelpDescriptions,
            keyboardShortcutsEnabled,
            showCtrlAltReactionShortcuts,
            t
        } = this.props;
        const classes = withStyles.getClasses(this.props);
        const shortcutDescriptions: Map<string, string> = displayShortcuts
            ? keyboardShortcutsHelpDescriptions
            : new Map();
        const shortcutsByDescription = new Map<string, string[]>();

        shortcutDescriptions.forEach((description, keyboardKey) => {
            const keyboardKeys = shortcutsByDescription.get(description) ?? [];
            const isReactionShortcut = description.startsWith('toolbar.reaction');

            if (!isReactionShortcut || !keyboardKey.startsWith('-:') || ctrlAltReactionShortcutsEnabled) {
                if (!keyboardKeys.includes(keyboardKey)) {
                    keyboardKeys.push(keyboardKey);
                }

                if (isReactionShortcut && keyboardKey.startsWith(':') && ctrlAltReactionShortcutsEnabled) {
                    const ctrlAltKeyboardKey = `-:${keyboardKey.slice(1)}`;

                    if (!keyboardKeys.includes(ctrlAltKeyboardKey)) {
                        keyboardKeys.push(ctrlAltKeyboardKey);
                    }
                }

                shortcutsByDescription.set(description, keyboardKeys);
            }
        });

        return (
            <div className = { classes.container }>
                <Checkbox
                    checked = { keyboardShortcutsEnabled }
                    className = { classes.checkbox }
                    label = { t('prejoin.keyboardShortcuts') }
                    name = 'enable-keyboard-shortcuts'
                    onChange = { this._onKeyboardShortcutEnableChanged } />
                {showCtrlAltReactionShortcuts && (
                    <Checkbox
                        checked = { ctrlAltReactionShortcutsEnabled }
                        className = { classes.checkbox }
                        disabled = { !keyboardShortcutsEnabled }
                        label = { t('settings.enableCtrlAltReactionShortcuts') }
                        name = 'enable-ctrl-alt-reaction-shortcuts'
                        onChange = { this._onCtrlAltReactionShortcutsEnableChanged } />
                )}
                {displayShortcuts && (
                    <ul className = { classes.listContainer }>
                        {Array.from(shortcutsByDescription)
                            .map(([ description, keyboardKeys ]) =>
                                this._renderShortcutsListItem(keyboardKeys, description))}
                    </ul>
                )}
            </div>
        );
    }
}

export default withStyles(translate(ShortcutsTab), styles);
