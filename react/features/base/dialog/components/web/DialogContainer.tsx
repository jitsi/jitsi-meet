import { ModalTransition } from '@atlaskit/modal-dialog';
import React from 'react';

import KeyboardShortcutsDialog from '../../../../keyboard-shortcuts/components/web/KeyboardShortcutsDialog';
import { connect } from '../../../redux/functions';
import AbstractDialogContainer, {
    Props, abstractMapStateToProps
} from '../AbstractDialogContainer';

import DialogTransition from './DialogTransition';

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
 * @augments AbstractDialogContainer
 */
class DialogContainer extends AbstractDialogContainer<State> {

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

export default connect(abstractMapStateToProps)(DialogContainer);
