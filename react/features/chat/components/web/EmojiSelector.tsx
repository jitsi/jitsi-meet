import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

interface IProps {
    onSelect: (emoji: string) => void;
}

const EMOJIS = [ '👍', '👎', '❤️', '😂', '😮', '👋' ];

const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
        },

        emojiButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2em',
            padding: '3px',
            borderRadius: '4px',

            '&:hover': {
                backgroundColor: theme.palette.action03,
                transform: 'scale(1.2)'
            }
        }
    };
});

const EmojiSelector: React.FC<IProps> = ({ onSelect }) => {
    const { classes } = useStyles();

    const handleSelect = useCallback(
        (emoji: string) => () => {
            onSelect(emoji);
        },
        [ onSelect ]
    );

    return (
        <div className = { classes.container }>
            {EMOJIS.map(emoji => (
                <button
                    className = { classes.emojiButton }
                    key = { emoji }
                    onClick = { handleSelect(emoji) }>
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default EmojiSelector;
