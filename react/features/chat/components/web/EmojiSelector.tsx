import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { QUICK_REACTIONS } from '../../constants';

interface IProps {
    onSelect: (emoji: string) => void;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        emojiGrid: {
            display: 'flex',
            flexDirection: 'row',
            borderRadius: '4px',
            backgroundColor: theme.palette.chatInputBackground
        },

        emojiButton: {
            background: 'none',
            border: 0,
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '1.5em',
            padding: '5px',
            '&:focus-visible': {
                outline: `2px solid ${theme.palette.focus01}`,
                outlineOffset: '-2px'
            }
        }
    };
});

const EmojiSelector: React.FC<IProps> = ({ onSelect }) => {
    const { classes } = useStyles();
    const { t } = useTranslation();

    const handleSelect = useCallback(
        (emoji: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            onSelect(emoji);
        },
        [ onSelect ]
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
        }

        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));

        if (items.length === 0) {
            return;
        }

        event.preventDefault();

        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
        const delta = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = currentIndex === -1
            ? 0
            : (currentIndex + delta + items.length) % items.length;

        items[nextIndex]?.focus();
    }, []);

    return (
        <div
            aria-label = { t('toolbar.accessibilityLabel.react') }
            aria-orientation = 'horizontal'
            className = { classes.emojiGrid }
            onKeyDown = { handleKeyDown }
            role = 'listbox'>
            {QUICK_REACTIONS.map(({ name, emoji, labelKey }) => (
                <button
                    aria-label = { t(labelKey) }
                    className = { classes.emojiButton }
                    key = { name }
                    onClick = { handleSelect(emoji) }
                    role = 'option'
                    type = 'button'>
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default EmojiSelector;
