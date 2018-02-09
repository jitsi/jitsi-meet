// @flow

import React, { Component } from 'react';

import { ToolbarButtonWithDialog } from '../../toolbox';

import ReactionsDialog from './ReactionsDialog';

type Props = {
    tooltipPosition: *
};

/**
 * The {@code ToolbarButton} configuration which describes how
 * {@link ReactionsToolbarButton} is to be rendered (by default).
 *
 * @type {object}
 */
const DEFAULT_BUTTON_CONFIGURATION = {
    buttonName: 'reactions',
    classNames: [ 'button', 'icon-star-full' ],
    enabled: true,
    id: 'toolbar_button_reactions',
    tooltipKey: 'reactionsButtonTip'
};

/**
 * Implements the Web {@code ToolbarButton} which shows the dialog with the list
 * of supported reactions (i.e. reaction buttons).
 */
export default class ReactionsToolbarButton extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ToolbarButtonWithDialog
                button = { DEFAULT_BUTTON_CONFIGURATION }
                content = { ReactionsDialog }
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}
