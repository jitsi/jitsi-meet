import { ModalTransition } from '@atlaskit/modal-dialog';
import React, { Component, ComponentType } from 'react';

import { IReduxState } from '../../../../app/types';
import { IReactionEmojiProps } from '../../../../reactions/constants';
import { connect } from '../../../redux/functions';

import DialogTransition from './DialogTransition';

interface IProps {

    /**
     * The component to render.
     */
    _component: ComponentType;

    /**
     * The props to pass to the component that will be rendered.
     */
    _componentProps: Object;

    /**
     * Whether the dialog is using the new component.
     */
    _isNewDialog: boolean;

    /**
     * Array of reactions to be displayed.
     */
    _reactionsQueue: Array<IReactionEmojiProps>;

    /**
     * True if the UI is in a compact state where we don't show dialogs.
     */
    _reducedUI: boolean;
}

/**
 * Implements a DialogContainer responsible for showing all dialogs. Necessary
 * for supporting @atlaskit's modal animations.
 *
 */
class DialogContainer extends Component<IProps> {

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

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this.props._isNewDialog ? (
            <DialogTransition>
                {this._renderDialogContent()}
            </DialogTransition>
        ) : (
            <ModalTransition>
                { this._renderDialogContent() }
            </ModalTransition>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated
 * {@code AbstractDialogContainer}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const stateFeaturesBaseDialog = state['features/base/dialog'];
    const { reducedUI } = state['features/base/responsive-ui'];

    return {
        _component: stateFeaturesBaseDialog.component,
        _componentProps: stateFeaturesBaseDialog.componentProps,
        _isNewDialog: stateFeaturesBaseDialog.isNewDialog,
        _reducedUI: reducedUI
    };
}

export default connect(mapStateToProps)(DialogContainer);
