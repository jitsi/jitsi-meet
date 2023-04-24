import React from 'react';
import { connect } from 'react-redux';

import InputDialog from '../../../base/dialog/components/native/InputDialog';
import AbstractDisplayNamePrompt from '../AbstractDisplayNamePrompt';

/**
 * Implements a component to render a display name prompt.
 */
class DisplayNamePrompt extends AbstractDisplayNamePrompt<any> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                descriptionKey = 'dialog.enterDisplayName'
                onSubmit = { this._onSetDisplayName }
                titleKey = 'dialog.displayNameRequired' />
        );
    }
}

export default connect()(DisplayNamePrompt);
