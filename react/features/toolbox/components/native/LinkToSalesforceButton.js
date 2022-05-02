// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconSalesforce } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { isSalesforceEnabled } from '../../../salesforce/functions';

/**
 * Implementation of a button for opening the Salesforce link dialog.
 */
class LinkToSalesforceButton extends AbstractButton<AbstractButtonProps, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.linkToSalesforce';
    icon = IconSalesforce;
    label = 'toolbar.linkToSalesforce';

    /**
     * Handles clicking / pressing the button, and opens the Salesforce link dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
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
function mapStateToProps(state) {
    return {
        visible: isSalesforceEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(LinkToSalesforceButton));
