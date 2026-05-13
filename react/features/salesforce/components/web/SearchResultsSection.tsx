import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import {
    IconRecordAccount,
    IconRecordContact,
    IconRecordLead,
    IconRecordOpportunity
} from '../../../base/icons/svg';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import {
    IAccountMatch,
    IContactMatch,
    ILeadMatch,
    IOpportunityMatch,
    ISearchResults,
    SalesforceObjectType
} from '../../types';

import { RecordListItem } from './RecordListItem';

interface IProps {
    linkingId: string | null;
    onLink: (type: SalesforceObjectType, data: IAccountMatch | ILeadMatch | IContactMatch | IOpportunityMatch) => void;
    results: ISearchResults;
}

const useStyles = makeStyles()(theme => {
    return {
        section: {
            marginBottom: '16px'
        },
        groupTitle: {
            fontSize: '0.75rem',
            fontWeight: 600,
            color: theme.palette.text03,
            textTransform: 'uppercase',
            margin: '16px 0 8px 0'
        },
        list: {
            listStyle: 'none',
            margin: 0,
            padding: 0
        },
        noResults: {
            textAlign: 'center',
            color: theme.palette.text03,
            padding: '24px'
        }
    };
});

/**
 * Component for displaying Salesforce search results with link buttons.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const SearchResultsSection = ({ results, linkingId, onLink }: IProps) => {
    const { t } = useTranslation();
    const { classes } = useStyles();

    const hasResults = results.accounts.length
        || results.leads.length
        || results.contacts.length
        || results.opportunities.length;

    const handleLinkAccount = useCallback((account: IAccountMatch) => {
        onLink('Account', account);
    }, [ onLink ]);

    const handleLinkLead = useCallback((lead: ILeadMatch) => {
        onLink('Lead', lead);
    }, [ onLink ]);

    const handleLinkContact = useCallback((contact: IContactMatch) => {
        onLink('Contact', contact);
    }, [ onLink ]);

    const handleLinkOpportunity = useCallback((opportunity: IOpportunityMatch) => {
        onLink('Opportunity', opportunity);
    }, [ onLink ]);

    if (!hasResults) {
        return (
            <div className = { classes.noResults }>
                {t('dialog.searchResultsNotFound')}
            </div>
        );
    }

    return (
        <div className = { classes.section }>
            {!!results.accounts.length && (
                <>
                    <h4 className = { classes.groupTitle }>{t('record.type.account')}</h4>
                    <ul className = { classes.list }>
                        {results.accounts.map(account => (
                            <RecordListItem
                                actionLabelKey = 'dialog.link'
                                actionType = { BUTTON_TYPES.PRIMARY }
                                disabled = { linkingId !== null }
                                icon = { IconRecordAccount }
                                isLoading = { linkingId === account.accountId }
                                key = { account.accountId }
                                name = { account.accountName }
                                onAction = { handleLinkAccount }
                                record = { account } />
                        ))}
                    </ul>
                </>
            )}

            {!!results.leads.length && (
                <>
                    <h4 className = { classes.groupTitle }>{t('record.type.lead')}</h4>
                    <ul className = { classes.list }>
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
                                onAction = { handleLinkLead }
                                record = { lead } />
                        ))}
                    </ul>
                </>
            )}

            {!!results.contacts.length && (
                <>
                    <h4 className = { classes.groupTitle }>{t('record.type.contact')}</h4>
                    <ul className = { classes.list }>
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
                                onAction = { handleLinkContact }
                                record = { contact } />
                        ))}
                    </ul>
                </>
            )}

            {!!results.opportunities.length && (
                <>
                    <h4 className = { classes.groupTitle }>{t('record.type.opportunity')}</h4>
                    <ul className = { classes.list }>
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
                                onAction = { handleLinkOpportunity }
                                record = { opp } />
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default SearchResultsSection;
