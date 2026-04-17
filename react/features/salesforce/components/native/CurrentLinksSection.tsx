import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';

import {
    IconRecordAccount,
    IconRecordContact,
    IconRecordLead,
    IconRecordOpportunity
} from '../../../base/icons/svg';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { ISalesforceData, SalesforceObjectType } from '../../types';

import { RecordListItem } from './RecordListItem';
import styles from './styles';

interface IProps {
    onUnlink: (type: SalesforceObjectType, id: string) => void;
    salesforceData: ISalesforceData | null;
    unlinkingId: string | null;
}

/**
 * Component for displaying currently linked Salesforce objects with unlink buttons.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const CurrentLinksSection = ({ salesforceData, unlinkingId, onUnlink }: IProps) => {
    const { t } = useTranslation();

    const hasAccount = Boolean(salesforceData?.account);
    const hasLeads = (salesforceData?.leads?.length ?? 0) > 0;
    const hasContacts = (salesforceData?.contacts?.length ?? 0) > 0;
    const hasDeal = Boolean(salesforceData?.deal);
    const hasAnyLinks = hasAccount || hasLeads || hasContacts || hasDeal;

    if (!hasAnyLinks) {
        return null;
    }

    return (
        <View style = { styles.currentLinksSection as ViewStyle }>
            <Text style = { styles.sectionTitle }>{t('dialog.currentLinks')}</Text>

            {salesforceData?.account && (
                <RecordListItem
                    actionLabelKey = 'dialog.unlink'
                    actionType = { BUTTON_TYPES.TERTIARY }
                    compact = { true }
                    disabled = { unlinkingId !== null }
                    icon = { IconRecordAccount }
                    isLoading = { unlinkingId === salesforceData.account.accountId }
                    metadata = { t('record.type.account') }
                    name = { salesforceData.account.accountName }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    onAction = { () => onUnlink('Account', salesforceData.account!.accountId) } />
            )}

            {salesforceData?.leads?.map(lead => (
                <RecordListItem
                    actionLabelKey = 'dialog.unlink'
                    actionType = { BUTTON_TYPES.TERTIARY }
                    compact = { true }
                    disabled = { unlinkingId !== null }
                    icon = { IconRecordLead }
                    isLoading = { unlinkingId === lead.leadId }
                    key = { lead.leadId }
                    metadata = { `${t('record.type.lead')}${lead.leadCompany ? ` \u2022 ${lead.leadCompany}` : ''}` }
                    name = { lead.leadName }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    onAction = { () => onUnlink('Lead', lead.leadId) } />
            ))}

            {salesforceData?.contacts?.map(contact => (
                <RecordListItem
                    actionLabelKey = 'dialog.unlink'
                    actionType = { BUTTON_TYPES.TERTIARY }
                    compact = { true }
                    disabled = { unlinkingId !== null }
                    icon = { IconRecordContact }
                    isLoading = { unlinkingId === contact.contactId }
                    key = { contact.contactId }
                    metadata = { t('record.type.contact') }
                    name = { contact.contactName }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    onAction = { () => onUnlink('Contact', contact.contactId) } />
            ))}

            {salesforceData?.deal && (
                <RecordListItem
                    actionLabelKey = 'dialog.unlink'
                    actionType = { BUTTON_TYPES.TERTIARY }
                    compact = { true }
                    disabled = { unlinkingId !== null }
                    icon = { IconRecordOpportunity }
                    isLoading = { unlinkingId === salesforceData.deal.opportunityId }
                    metadata = { `${salesforceData.deal.opportunityStage}${
                        salesforceData.deal.amount !== undefined
                            ? ` \u2022 $${salesforceData.deal.amount.toLocaleString()}`
                            : ''
                    }` }
                    name = { salesforceData.deal.opportunityName }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    onAction = { () => onUnlink('Opportunity', salesforceData.deal!.opportunityId) } />
            )}
        </View>
    );
};

export default CurrentLinksSection;
