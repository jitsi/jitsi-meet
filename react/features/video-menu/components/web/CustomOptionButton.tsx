import React, { useMemo } from 'react';

import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';

const CustomOptionButton = (
        { icon, onClick, text }:
        {
            icon: string;
            onClick: (e?: React.MouseEvent<Element, MouseEvent> | undefined) => void;
            text: string;
    }
) => {
    const iconNode = useMemo(() => (<img
        height = { 20 }
        src = { icon }
        width = { 20 } />), [ icon ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            customIcon = { iconNode }
            onClick = { onClick }
            text = { text } />
    );
};

export default CustomOptionButton;
