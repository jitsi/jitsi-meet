import React from 'react';
import { makeStyles } from 'tss-react/mui';

interface EmojiSelectorProps {
    onSelect: (emoji: string) => void;
}

const useStyles = makeStyles()(theme => {
    return {
        emojiMap: {
            display: 'flex',
            flexDirection: 'row',
            borderRadius: '4px',
            backgroundColor: '#3D3D3D'
        }
    }
})

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
        <div className = { classes.emojiMap }>
            {emojiNames.map((name) => (
                <span
                    key={name}
                    onClick={() => onSelect(emojiMap[name])}
                    style={{
                        cursor: 'pointer',
                        padding: '5px',
                        fontSize: '1.5em'
                    }}
                >
                    {emojiMap[name]}
                </span>
            ))}
        </div>
    );
};

export default EmojiSelector;
