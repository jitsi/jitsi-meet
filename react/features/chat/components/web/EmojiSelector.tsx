import { Theme } from '@mui/material';
import React, { useCallback, useEffect, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';

interface IProps {
    onClose?: () => void;
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
            cursor: 'pointer',
            padding: '5px',
            fontSize: '1.5em',
            borderRadius: '4px',
            outline: 'none',

            '&:hover, &:focus, &.focus-visible': {
                backgroundColor: theme.palette.ui02
            }
        }
    };
});

const EmojiSelector: React.FC<IProps> = ({ onClose, onSelect }) => {
    const { classes } = useStyles();
    const containerRef = useRef<HTMLDivElement>(null);

    const emojiMap: Record<string, string> = {
        thumbsUp: '👍',
        redHeart: '❤️',
        faceWithTearsOfJoy: '😂',
        faceWithOpenMouth: '😮',
        fire: '🔥'
    };
    const emojiNames = Object.keys(emojiMap);

    useEffect(() => {
        requestAnimationFrame(() => {
            const firstEmoji = containerRef.current?.querySelector<HTMLElement>('[role="button"]');

            firstEmoji?.focus();
        });
    }, []);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose?.();

            return;
        }

        const items = Array.from(
            containerRef.current?.querySelectorAll<HTMLElement>('[role="button"]') || []
        );

        if (!items.length) {
            return;
        }

        const currentIndex = items.indexOf(document.activeElement as HTMLElement);

        if (event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();

            if (event.shiftKey) {
                const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;

                items[prevIndex]?.focus();
            } else {
                const nextIndex = currentIndex >= items.length - 1 || currentIndex === -1
                    ? 0
                    : currentIndex + 1;

                items[nextIndex]?.focus();
            }
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            const nextIndex = currentIndex >= items.length - 1 || currentIndex === -1
                ? 0
                : currentIndex + 1;

            items[nextIndex]?.focus();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;

            items[prevIndex]?.focus();
        }
    }, [ onClose ]);

    const handleSelect = useCallback(
        (emoji: string) => (event: React.MouseEvent<HTMLSpanElement>) => {
            event.preventDefault();
            onSelect(emoji);
        },
        [ onSelect ]
    );

    const handleItemKeyDown = useCallback((emoji: string) => (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onSelect(emoji);
        }
    }, [ onSelect ]);

    return (
        <div
            className = { classes.emojiGrid }
            onKeyDown = { handleKeyDown }
            ref = { containerRef }
            role = 'toolbar'>
            {emojiNames.map(name => (
                <span
                    aria-label = { name }
                    className = { classes.emojiButton }
                    key = { name }
                    onClick = { handleSelect(emojiMap[name]) }
                    onKeyDown = { handleItemKeyDown(emojiMap[name]) }
                    role = 'button'
                    tabIndex = { 0 }>
                    {emojiMap[name]}
                </span>
            ))}
        </div>
    );
};

export default EmojiSelector;
