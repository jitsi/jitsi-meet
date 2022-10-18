import { Theme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Dialog from '../../../base/ui/components/web/Dialog';

/**
 * The type of the React {@code Component} props of
 * {@link KeyboardShortcutsDialog}.
 */
interface Props {

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
const useStyles = makeStyles()((theme: Theme) => {
    return {
        list: {
            listStyleType: 'none',
            padding: 0,

            '& .shortcuts-list__item': {
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing(2),
                ...withPixelLineHeight(theme.typography.labelRegular),
                color: theme.palette.text01
            },

            '& .item-action': {
                backgroundColor: theme.palette.ui04,
                fontWeight: 'bold',
                padding: '1px 4px',
                borderRadius: '4px'
            }
        }
    };
});

const KeyboardShortcutsDialog = ({ shortcutDescriptions }: Props) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();

    // eslint-disable-next-line react/no-multi-comp
    const _renderShortcutsListItem = (keyboardKey: string, translationKey: string) => {
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
                    aria-label = { t(translationKey) }
                    className = 'shortcuts-list__description'>
                    {t(translationKey)}
                </span>
                <span className = 'item-action'>
                    {keyboardKey.startsWith(':')
                        ? `${modifierKey} + ${keyboardKey.slice(1)}`
                        : keyboardKey}
                </span>
            </li>
        );
    };

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = 'keyboardShortcuts.keyboardShortcuts'>
            <div
                id = 'keyboard-shortcuts'>
                <ul
                    className = { cx('shortcuts-list', classes.list) }
                    id = 'keyboard-shortcuts-list'>
                    {Array.from(shortcutDescriptions)
                        .map(description => _renderShortcutsListItem(...description))}
                </ul>
            </div>
        </Dialog>
    );
};

export default KeyboardShortcutsDialog;
