import React, { Component, ComponentType } from 'react';

import { IState } from '../../../app/types';
import { ReactionEmojiProps } from '../../../reactions/constants';

/**
 * The type of the React {@code Component} props of {@link DialogContainer}.
 */
interface Props {

    /**
     * The component to render.
     */
    _component: ComponentType;

    /**
     * The props to pass to the component that will be rendered.
     */
    _componentProps: Object;

    /**
     * Array of reactions to be displayed.
     */
    _reactionsQueue: Array<ReactionEmojiProps>;

    /**
     * True if the UI is in a compact state where we don't show dialogs.
     */
    _reducedUI: boolean;
}

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
export function abstractMapStateToProps(state: IState) {
    const stateFeaturesBaseDialog = state['features/base/dialog'];
    const { reducedUI } = state['features/base/responsive-ui'];

    return {
        _component: stateFeaturesBaseDialog.component,
        _componentProps: stateFeaturesBaseDialog.componentProps,
        _reducedUI: reducedUI
    };
}
