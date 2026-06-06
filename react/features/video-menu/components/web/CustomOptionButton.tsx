import React, { useCallback } from 'react';

import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';

const CustomOptionButton = (
        { icon: iconSrc, onClick, text }:
        {
            icon: string;
            onClick: (e?: React.MouseEvent<Element, MouseEvent> | undefined) => void;
            text: string;
        }
) => {

    const icon = useCallback(props => (<img
        src = { iconSrc }
        { ...props } />), [ iconSrc ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            icon = { icon }
            onClick = { onClick }
            text = { text } />
    );
};

export default CustomOptionButton;
