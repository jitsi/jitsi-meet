import { Theme } from '@mui/material';
import React from 'react';
import { face_with_open_mouth, face_with_tears_of_joy } from 'react-emoji-render/data/aliases';
import { makeStyles } from 'tss-react/mui';

interface EmojiSelectorProps {
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

const EmojiSelector: React.FC<EmojiSelectorProps> = ({ onSelect }) => {
    const { classes } = useStyles();

    const emojiMap: Record<string, string> = {
        thumbs_up: '👍',
        red_heart: '❤️',
        face_with_tears_of_joy: '😂',
        face_with_open_mouth: '😮',
        fire: '🔥'
    };
    const emojiNames = Object.keys(emojiMap);

    return (
        <div className = { classes.emojiGrid }>
            {emojiNames.map(name => (
                <span
                    className = { classes.emojiButton }
                    key = { name }
                    onClick = { () => onSelect(emojiMap[name]) }>
                    {emojiMap[name]}
                </span>
            ))}
        </div>
    );
};

export default EmojiSelector;
