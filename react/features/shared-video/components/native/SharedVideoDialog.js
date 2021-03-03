// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { defaultSharedVideoLink } from '../../constants';
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
                onSubmit = { this._onSetVideoLink }
                textInputProps = {{
                    placeholder: defaultSharedVideoLink
                }} />
        );
    }

    _onSetVideoLink: string => boolean;
}

export default connect()(SharedVideoDialog);
