// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { defaultMobileSharedVideoLink } from '../../constants';
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
                onSubmit = { super._onSetVideoLink }
                textInputProps = {{
                    placeholder: defaultMobileSharedVideoLink
                }} />
        );
    }
}

export default connect()(SharedVideoDialog);
