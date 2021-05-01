// @flow

import React from 'react';

import { InputDialog } from '../../../base/dialog';
import { connect } from '../../../base/redux';
import { defaultSharedURL } from '../../constants';
import AbstractSharedURLDialog from '../AbstractSharedURLDialog';

/**
 * Implements a component to render a display name prompt.
 */
class SharedURLDialog extends AbstractSharedURLDialog<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <InputDialog
                contentKey = 'dialog.shareURLTitle'
                onSubmit = { this._onSetURLLink }
                textInputProps = {{
                    placeholder: defaultSharedURL
                }} />
        );
    }

    _onSetURLLink: string => boolean;
}

export default connect()(SharedURLDialog);
