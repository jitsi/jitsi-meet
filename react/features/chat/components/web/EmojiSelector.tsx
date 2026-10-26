import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

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

    const emojiMap: Record<string, string> = {
        thumbsUp: '👍',
        redHeart: '❤️',
        faceWithTearsOfJoy: '😂',
        faceWithOpenMouth: '😮',
        fire: '🔥'
    };
    const emojiLabels: Record<string, string> = {
        thumbsUp: t('chat.reactions.thumbsUp'),
        redHeart: t('chat.reactions.redHeart'),
        faceWithTearsOfJoy: t('chat.reactions.faceWithTearsOfJoy'),
        faceWithOpenMouth: t('chat.reactions.faceWithOpenMouth'),
        fire: t('chat.reactions.fire')
    };
    const emojiNames = Object.keys(emojiMap);

    const handleSelect = useCallback(
        (emoji: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            onSelect(emoji);
        },
        [ onSelect ]
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            const item = (event.target as HTMLElement).closest('button');

            if (item instanceof HTMLButtonElement && event.currentTarget.contains(item)) {
                event.preventDefault();
                event.stopPropagation();
                item.click();
            }

            return;
        }

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
            aria-orientation = 'horizontal'
            className = { classes.emojiGrid }
            onKeyDown = { handleKeyDown }
            role = 'menu'>
            {emojiNames.map(name => (
                <button
                    aria-label = { emojiLabels[name] }
                    className = { classes.emojiButton }
                    key = { name }
                    onClick = { handleSelect(emojiMap[name]) }
                    role = 'menuitem'
                    type = 'button'>
                    {emojiMap[name]}
                </button>
            ))}
        </div>
    );
};

export default EmojiSelector;
