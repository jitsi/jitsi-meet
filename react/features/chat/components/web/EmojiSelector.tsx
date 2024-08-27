import { Theme } from '@mui/material';
import React from 'react';
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
        grin: '😀',
        smile: '😁',
        laugh: '😂',
        rofl: '🤣',
        happy: '😃'
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
