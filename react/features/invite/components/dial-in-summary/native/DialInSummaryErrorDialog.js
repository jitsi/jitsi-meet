// @flow

import React, { Component } from 'react';

import { AlertDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';

/**
 * Dialog to inform the user that we could't fetch the dial-in info page.
 */
class DialInSummaryErrorDialog extends Component<{}> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <AlertDialog
                contentKey = 'info.dialInSummaryError' />
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect()(DialInSummaryErrorDialog));
