import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
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
            backgroundColor: theme.palette.ui03
        },

        emojiButton: {
            cursor: 'pointer',
            padding: '5px',
            fontSize: '1.5em'
        }
    };
});

const EmojiSelector: React.FC<IProps> = ({ onSelect }) => {
    const { classes } = useStyles();

    const emojiMap: Record<string, string> = {
        thumbsUp: '👍',
        redHeart: '❤️',
        faceWithTearsOfJoy: '😂',
        faceWithOpenMouth: '😮',
        fire: '🔥'
    };
    const emojiNames = Object.keys(emojiMap);

    const handleSelect = useCallback(
        (emoji: string) => (event: React.MouseEvent<HTMLSpanElement>) => {
            event.preventDefault();
            onSelect(emoji);
        },
        [ onSelect ]
    );

    return (
        <div className = { classes.emojiGrid }>
            {emojiNames.map(name => (
                <span
                    className = { classes.emojiButton }
                    key = { name }
                    onClick = { handleSelect(emojiMap[name]) }>
                    {emojiMap[name]}
                </span>
            ))}
        </div>
    );
};

export default EmojiSelector;
