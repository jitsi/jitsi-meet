import React, { Component, ComponentType } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import JitsiPortal from '../../../../toolbox/components/web/JitsiPortal';
import { showOverflowDrawer } from '../../../../toolbox/functions.web';

import DialogTransition from './DialogTransition';

interface IProps {

    /**
     * The component to render.
     */
    _component?: ComponentType;

    /**
     * The props to pass to the component that will be rendered.
     */
    _componentProps?: Object;

    /**
     * Whether the overflow drawer should be used.
     */
    _overflowDrawer: boolean;

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
        return (
            <DialogTransition>
                {this.props._overflowDrawer
                    ? <JitsiPortal>{this._renderDialogContent()}</JitsiPortal>
                    : this._renderDialogContent()}
            </DialogTransition>
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
    const overflowDrawer = showOverflowDrawer(state);

    return {
        _component: stateFeaturesBaseDialog.component,
        _componentProps: stateFeaturesBaseDialog.componentProps,
        _overflowDrawer: overflowDrawer,
        _reducedUI: reducedUI
    };
}

export default connect(mapStateToProps)(DialogContainer);
