import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import AlertDialog from '../../../../base/dialog/components/native/AlertDialog';
import { translate } from '../../../../base/i18n/functions';

/**
 * Dialog to inform the user that we couldn't fetch the dial-in info page.
 */
class DialInSummaryErrorDialog extends Component<WithTranslation> {
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
}

export default translate(connect()(DialInSummaryErrorDialog));
