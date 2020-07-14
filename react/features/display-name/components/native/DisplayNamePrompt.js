// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import AbstractDisplayNamePrompt from '../AbstractDisplayNamePrompt';

/**
 * Implements a component to render a display name prompt.
 */
class DisplayNamePrompt extends AbstractDisplayNamePrompt<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                contentKey = 'dialog.enterDisplayName'
                onSubmit = { this._onSetDisplayName } />
        );
    }

    _onSetDisplayName: string => boolean;
}

export default connect()(DisplayNamePrompt);
