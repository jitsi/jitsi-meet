// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import AbstractSharedVideoDialog from '../AbstractSharedVideoDialog';

/**
 * Implements a component to render a display name prompt.
 */
class SharedVideoDialog extends AbstractSharedVideoDialog<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                contentKey = 'dialog.shareVideoTitle'
                onSubmit = { this._onSubmit }
                textInputProps = {{
                    placeholder: 'https://youtu.be/TB7LlM4erx8'
                }} />
        );
    }

    _onSubmit: string => boolean;
}

export default connect()(SharedVideoDialog);
