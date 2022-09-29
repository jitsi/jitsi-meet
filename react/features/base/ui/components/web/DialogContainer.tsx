import { ModalTransition } from '@atlaskit/modal-dialog';
import React, { Component, ComponentType } from 'react';

import { IState } from '../../../../app/types';
import KeyboardShortcutsDialog from '../../../../keyboard-shortcuts/components/web/KeyboardShortcutsDialog';
import { ReactionEmojiProps } from '../../../../reactions/constants';
import { connect } from '../../../redux/functions';

import DialogTransition from './DialogTransition';

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

// This function is necessary while the transition from @atlaskit dialog to our component is ongoing.
const isNewDialog = (component: any) => {
    const list = [ KeyboardShortcutsDialog ];

    return Boolean(list.find(comp => comp === component));
};

// Needed for the transition to our component.
type State = {
    isNewDialog: boolean;
};

/**
 * Implements a DialogContainer responsible for showing all dialogs. Necessary
 * for supporting @atlaskit's modal animations.
 *
 */
class DialogContainer extends Component<Props, State> {

    /**
     * Initializes a new {@code DialogContainer} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code DialogContainer} instance with.
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            isNewDialog: false
        };
    }

    /**
     * Check which Dialog container to render.
     * Needed during transition from atlaskit.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: Props) {
        if (this.props._component && prevProps._component !== this.props._component) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                isNewDialog: isNewDialog(this.props._component)
            });
        }
    }

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
        return this.state.isNewDialog ? (
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
 * @returns {Props}
 */
function mapStateToProps(state: IState) {
    const stateFeaturesBaseDialog = state['features/base/dialog'];
    const { reducedUI } = state['features/base/responsive-ui'];

    return {
        _component: stateFeaturesBaseDialog.component,
        _componentProps: stateFeaturesBaseDialog.componentProps,
        _reducedUI: reducedUI
    };
}

export default connect(mapStateToProps)(DialogContainer);
