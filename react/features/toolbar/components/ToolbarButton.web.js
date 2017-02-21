import React from 'react';

import AbstractToolbarButton from './AbstractToolbarButton';

/**
 * Represents a button in Toolbar on React.
 *
 * @class ToolbarButton
 * @extends AbstractToolbarButton
 */
export default class ToolbarButton extends AbstractToolbarButton {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <a className = 'button' />
        );
    }
}
