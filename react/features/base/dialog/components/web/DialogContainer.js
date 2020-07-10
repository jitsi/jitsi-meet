import { ModalTransition } from '@atlaskit/modal-dialog';
import React from 'react';

import { connect } from '../../../redux';
import AbstractDialogContainer, {
    abstractMapStateToProps
} from '../AbstractDialogContainer';

/**
 * Implements a DialogContainer responsible for showing all dialogs. Necessary
 * for supporting @atlaskit's modal animations.
 *
 * @extends AbstractDialogContainer
 */
class DialogContainer extends AbstractDialogContainer {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.props._rawDialog) {
            return this._renderDialogContent();
        }

        return (
            <ModalTransition>
                { this._renderDialogContent() }
            </ModalTransition>
        );
    }
}

export default connect(abstractMapStateToProps)(DialogContainer);

