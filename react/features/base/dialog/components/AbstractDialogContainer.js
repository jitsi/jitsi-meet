/* @flow */

import React, { Component } from 'react';

import { type ReactionEmojiProps } from '../../../reactions/constants';

/**
 * The type of the React {@code Component} props of {@link DialogContainer}.
 */
type Props = {

    /**
     * The component to render.
     */
    _component: Function,

    /**
     * The props to pass to the component that will be rendered.
     */
    _componentProps: Object,

    /**
     * True if the dialog is a raw dialog (doesn't inherit behavior from other common frameworks, such as atlaskit).
     */
    _rawDialog: boolean,

    /**
     * True if the UI is in a compact state where we don't show dialogs.
     */
    _reducedUI: boolean,

    /**
     * Array of reactions to be displayed.
     */
    _reactionsQueue: Array<ReactionEmojiProps>
};

/**
 * Implements a DialogContainer responsible for showing all dialogs.
 */
export default class AbstractDialogContainer extends Component<Props> {
    /**
     * Returns the dialog to be displayed.
     *
     * @private
     * @returns {ReactElement|null}
     */
    _renderDialogContent() {
        const {
            _component: component,
            _reducedUI: reducedUI
        } = this.props;

        return (
            component && !reducedUI
                ? React.createElement(component, this.props._componentProps)
                : null);
    }
}

/**
 * Maps (parts of) the redux state to the associated
 * {@code AbstractDialogContainer}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
export function abstractMapStateToProps(state: Object): $Shape<Props> {
    const stateFeaturesBaseDialog = state['features/base/dialog'];
    const { reducedUI } = state['features/base/responsive-ui'];

    return {
        _component: stateFeaturesBaseDialog.component,
        _componentProps: stateFeaturesBaseDialog.componentProps,
        _rawDialog: stateFeaturesBaseDialog.rawDialog,
        _reducedUI: reducedUI
    };
}
