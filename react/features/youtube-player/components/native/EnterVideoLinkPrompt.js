// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import AbstractEnterVideoLinkPrompt from '../AbstractEnterVideoLinkPrompt';

/**
 * Implements a component to render a display name prompt.
 */
class EnterVideoLinkPrompt extends AbstractEnterVideoLinkPrompt<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                contentKey = 'dialog.shareVideoTitle'
                onSubmit = { this._onSetVideoLink }
                textInputProps = {{
                    placeholder: 'https://youtu.be/TB7LlM4erx8'
                }} />
        );
    }

    _onSetVideoLink: string => boolean;
}

export default connect()(EnterVideoLinkPrompt);
