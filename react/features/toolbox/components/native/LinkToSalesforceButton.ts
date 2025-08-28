import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconCloudUpload } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { isSalesforceEnabled } from '../../../salesforce/functions';

/**
 * Implementation of a button for opening the Salesforce link dialog.
 */
class LinkToSalesforceButton extends AbstractButton<AbstractButtonProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.linkToSalesforce';
    override icon = IconCloudUpload;
    override label = 'toolbar.linkToSalesforce';

    /**
     * Handles clicking / pressing the button, and opens the Salesforce link dialog.
     *
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        sendAnalytics(createToolbarEvent('link.to.salesforce'));

        return navigate(screen.conference.salesforce);
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state: IReduxState) {
    return {
        visible: isSalesforceEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(LinkToSalesforceButton));
