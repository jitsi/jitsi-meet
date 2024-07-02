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
        <div className="emoji-selector" style={{ display: 'flex', flexDirection: 'row' }}>
            {emojiNames.map(name => (
                <span 
                    key={name} 
                    onClick={() => onSelect(emojiMap[name])} 
                    style={{ cursor: 'pointer', padding: '5px', fontSize: '1.5em' }}>
                    {emojiMap[name]}
                </span>
            ))}
        </div>
    );
};

export default EmojiSelector;
