import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    SALESFORCE_LINK_NOTIFICATION_ID
} from '../notifications/constants';

import { SalesforceLinkDialog } from './components';
import { isSalesforceEnabled } from './functions';

/**
 * Displays the notification for linking the meeting to Salesforce.
 *
 * @returns {void}
 */
export function showSalesforceNotification() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!isSalesforceEnabled(getState())) {
            return;
        }

        dispatch(showNotification({
            descriptionKey: 'notify.linkToSalesforceDescription',
            titleKey: 'notify.linkToSalesforce',
            uid: SALESFORCE_LINK_NOTIFICATION_ID,
            customActionNameKey: [ 'notify.linkToSalesforceKey' ],
            customActionHandler: [ () => {
                dispatch(hideNotification(SALESFORCE_LINK_NOTIFICATION_ID));
                dispatch(openDialog(SalesforceLinkDialog));
            } ],
            appearance: NOTIFICATION_TYPE.NORMAL
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
    };
}
