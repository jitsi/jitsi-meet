import React from 'react';

const EmojiSelector = ({ onSelect }) => {
    const emojiMap = {
        grin: '😀',
        smile: '😁',
        laugh: '😂',
        rofl: '🤣',
        happy: '😃'
    };

    const emojiNames = Object.keys(emojiMap);

    return (
        <div
            style = {{ display: 'flex',
                flexDirection: 'row',
                borderRadius: '4px',
                backgroundColor: '#3D3D3D' }}>
            {emojiNames.map(name => (
                <span
                    key = { name }
                    onClick = { () => onSelect(emojiMap[name]) }
                    style = {{ cursor: 'pointer',
                        padding: '5px',
                        fontSize: '1.5em' }}>
                    {emojiMap[name]}
                </span>
            ))}
        </div>
    );
};

export default EmojiSelector;
