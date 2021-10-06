// @flow

import Tooltip from '@atlaskit/tooltip';
import React from 'react';

import { isMobileBrowser } from '../../environment/utils';

type Props = {

    /**
     * Children of the component.
     */
    children: React$Node,

    /**
     * The text to be displayed in the tooltip.
     */
    content?: string | null,

    /**
     * The position of the tooltip relative to the element it contains.
     */
    position?: string

}

/**
 * Wrapper of AtlasKit Tooltip that doesn't render the actual tooltip in mobile browsers.
 *
 * @returns {ReactElement}
 */
function TooltipWrapper({
    children,
    content,
    position
}: Props) {
    if (isMobileBrowser()) {
        return children;
    }

    return (
        <Tooltip
            content = { content }
            position = { position }>
            {children}
        </Tooltip>
    );
}

export default TooltipWrapper;
