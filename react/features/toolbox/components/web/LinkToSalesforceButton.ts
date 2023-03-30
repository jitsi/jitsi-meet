import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconCloudUpload } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import SalesforceLinkDialog from '../../../salesforce/components/web/SalesforceLinkDialog';

/**
 * Implementation of a button for opening the Salesforce link dialog.
 */
class LinkToSalesforce extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.linkToSalesforce';
    icon = IconCloudUpload;
    label = 'toolbar.linkToSalesforce';
    tooltip = 'toolbar.linkToSalesforce';

    /**
     * Handles clicking / pressing the button, and opens the Salesforce link dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('link.to.salesforce'));
        dispatch(openDialog(SalesforceLinkDialog));
    }
}

export default translate(connect()(LinkToSalesforce));
