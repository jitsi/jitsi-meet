// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconSalesforce } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { SalesforceLinkDialog } from '../../../salesforce/components';

/**
 * The type of the React {@code Component} props of {@link LinkToSalesforce}.
 */
 type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implementation of a button for opening the Salesforce link dialog.
 */
class LinkToSalesforce extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.linkToSalesforce';
    icon = IconSalesforce;
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
