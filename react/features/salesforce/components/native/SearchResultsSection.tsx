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
import {
    IAccountMatch,
    IContactMatch,
    ILeadMatch,
    IOpportunityMatch,
    ISearchResults,
    SalesforceObjectType
} from '../../types';

import { RecordListItem } from './RecordListItem';
import styles from './styles';

interface IProps {
    linkingId: string | null;
    onLink: (type: SalesforceObjectType, data: IAccountMatch | ILeadMatch | IContactMatch | IOpportunityMatch) => void;
    results: ISearchResults;
}

/**
 * Component for displaying Salesforce search results with link buttons.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const SearchResultsSection = ({ results, linkingId, onLink }: IProps) => {
    const { t } = useTranslation();

    const hasResults = results.accounts.length > 0
        || results.leads.length > 0
        || results.contacts.length > 0
        || results.opportunities.length > 0;

    if (!hasResults) {
        return (
            <View style = { styles.noResultsContainer as ViewStyle }>
                <Text style = { styles.noResultsText }>
                    {t('dialog.searchResultsNotFound')}
                </Text>
            </View>
        );
    }

    return (
        <View>
            {results.accounts.length > 0 && (
                <>
                    <Text style = { styles.groupTitle }>{t('record.type.account')}</Text>
                    {results.accounts.map(account => (
                        <RecordListItem
                            actionLabelKey = 'dialog.link'
                            actionType = { BUTTON_TYPES.PRIMARY }
                            disabled = { linkingId !== null }
                            icon = { IconRecordAccount }
                            isLoading = { linkingId === account.accountId }
                            key = { account.accountId }
                            name = { account.accountName }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onAction = { () => onLink('Account', account) } />
                    ))}
                </>
            )}

            {results.leads.length > 0 && (
                <>
                    <Text style = { styles.groupTitle }>{t('record.type.lead')}</Text>
                    {results.leads.map(lead => (
                        <RecordListItem
                            actionLabelKey = 'dialog.link'
                            actionType = { BUTTON_TYPES.PRIMARY }
                            disabled = { linkingId !== null }
                            icon = { IconRecordLead }
                            isLoading = { linkingId === lead.leadId }
                            key = { lead.leadId }
                            metadata = { lead.leadCompany }
                            name = { lead.leadName }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onAction = { () => onLink('Lead', lead) } />
                    ))}
                </>
            )}

            {results.contacts.length > 0 && (
                <>
                    <Text style = { styles.groupTitle }>{t('record.type.contact')}</Text>
                    {results.contacts.map(contact => (
                        <RecordListItem
                            actionLabelKey = 'dialog.link'
                            actionType = { BUTTON_TYPES.PRIMARY }
                            disabled = { linkingId !== null }
                            icon = { IconRecordContact }
                            isLoading = { linkingId === contact.contactId }
                            key = { contact.contactId }
                            metadata = { contact.contactEmail }
                            name = { contact.contactName }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onAction = { () => onLink('Contact', contact) } />
                    ))}
                </>
            )}

            {results.opportunities.length > 0 && (
                <>
                    <Text style = { styles.groupTitle }>{t('record.type.opportunity')}</Text>
                    {results.opportunities.map(opp => (
                        <RecordListItem
                            actionLabelKey = 'dialog.link'
                            actionType = { BUTTON_TYPES.PRIMARY }
                            disabled = { linkingId !== null }
                            icon = { IconRecordOpportunity }
                            isLoading = { linkingId === opp.opportunityId }
                            key = { opp.opportunityId }
                            metadata = { `${opp.opportunityStage}${
                                opp.amount !== undefined ? ` \u2022 $${opp.amount.toLocaleString()}` : ''
                            }` }
                            name = { opp.opportunityName }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onAction = { () => onLink('Opportunity', opp) } />
                    ))}
                </>
            )}
        </View>
    );
};

export default SearchResultsSection;
