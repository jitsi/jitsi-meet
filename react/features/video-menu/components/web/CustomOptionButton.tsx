import React, { useCallback, useMemo } from 'react';

import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';


const CustomOptionButton = (
        { icon, text, id, participantId }:
        {
            icon: string;
            id: string;
            participantId: string;
            text: string;
    }
) => {
    const _onClick = useCallback(() => {
        APP.API.notifyRemoteMenuButtonClicked(id, participantId);
    }, [ ]);

    const iconNode = useMemo(() => (<img
        height = { 20 }
        src = { icon }
        width = { 20 } />), [ icon ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { text }
            customIcon = { iconNode }
            onClick = { _onClick }
            text = { text } />
    );
};

export default CustomOptionButton;
