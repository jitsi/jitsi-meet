// @flow

import React from 'react';

import { connect } from '../../../base/redux';

import { InputDialog } from '../../../base/dialog';

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
                onSubmit = { this._onSetVideoLink } />
        );
    }

    _onSetVideoLink: string => boolean;
}

export default connect()(EnterVideoLinkPrompt);
