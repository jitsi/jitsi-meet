import React from 'react';

const EmojiSelector = ({ onSelect }) => {
    const emojis = ['😀', '😁', '😂', '🤣', '😃']; // Example emojis
    
    return (
        <div className="emoji-selector" style={{ display: 'flex', flexDirection: 'row' }}>
            {emojis.map(emoji => (
                <span 
                    key={emoji} 
                    onClick={() => onSelect(emoji)} 
                    style={{ cursor: 'pointer', padding: '5px', fontSize: '1.5em' }}>
                    {emoji}
                </span>
            ))}
        </div>
    );
};

export default EmojiSelector;
