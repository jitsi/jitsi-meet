import React from 'react';

interface IHiddenDescriptionProps {
    children: React.ReactNode;
    id: string;
}

export const HiddenDescription: React.FC<IHiddenDescriptionProps> = ({ id, children }) => {
    const hiddenStyle: React.CSSProperties = {
        border: 0,
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap'
    };

    return (
        <span
            id = { id }
            style = { hiddenStyle }>
            {children}
        </span>
    );
};
