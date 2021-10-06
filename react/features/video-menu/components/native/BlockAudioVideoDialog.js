// @flow

import React from 'react';

import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractBlockAudioVideoDialog
    from '../AbstractBlockAudioVideoDialog';

/**
 * Dialog to confirm a remote participant kick action.
 */
class BlockAudioVideoDialog extends AbstractBlockAudioVideoDialog {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ConfirmDialog
                contentKey = 'dialog.blockAudioVideoMsg'
                onSubmit = { this._onSubmit } />
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(BlockAudioVideoDialog));
