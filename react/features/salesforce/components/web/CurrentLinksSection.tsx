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
import { ISalesforceData, SalesforceObjectType } from '../../types';

import { RecordListItem } from './RecordListItem';

interface IProps {
    onUnlink: (type: SalesforceObjectType, id: string) => void;
    salesforceData: ISalesforceData | null;
    unlinkingId: string | null;
}

const useStyles = makeStyles()(theme => {
    return {
        section: {
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.palette.ui05}`
        },
        title: {
            fontSize: '0.875rem',
            fontWeight: 600,
            margin: '0 0 12px 0'
        },
        list: {
            listStyle: 'none',
            margin: 0,
            padding: 0
        }
    };
});

/**
 * Component for displaying currently linked Salesforce objects with unlink buttons.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const CurrentLinksSection = ({ salesforceData, unlinkingId, onUnlink }: IProps) => {
    const { t } = useTranslation();
    const { classes } = useStyles();

    const hasAccount = Boolean(salesforceData?.account);
    const hasLeads = salesforceData?.leads?.length;
    const hasContacts = salesforceData?.contacts?.length;
    const hasDeal = Boolean(salesforceData?.deal);
    const hasAnyLinks = hasAccount || hasLeads || hasContacts || hasDeal;

    const handleUnlinkAccount = useCallback((id: string) => {
        onUnlink('Account', id);
    }, [ onUnlink ]);

    const handleUnlinkLead = useCallback((id: string) => {
        onUnlink('Lead', id);
    }, [ onUnlink ]);

    const handleUnlinkContact = useCallback((id: string) => {
        onUnlink('Contact', id);
    }, [ onUnlink ]);

    const handleUnlinkOpportunity = useCallback((id: string) => {
        onUnlink('Opportunity', id);
    }, [ onUnlink ]);

    if (!hasAnyLinks) {
        return null;
    }

    return (
        <div className = { classes.section }>
            <h3 className = { classes.title }>{t('dialog.currentLinks')}</h3>
            <ul className = { classes.list }>
                {salesforceData?.account && (
                    <RecordListItem
                        actionLabelKey = 'dialog.unlink'
                        actionType = { BUTTON_TYPES.TERTIARY }
                        disabled = { unlinkingId !== null }
                        icon = { IconRecordAccount }
                        isLoading = { unlinkingId === salesforceData.account.accountId }
                        key = { salesforceData.account.accountId }
                        metadata = { t('record.type.account') }
                        name = { salesforceData.account.accountName }
                        onAction = { handleUnlinkAccount }
                        record = { salesforceData.account.accountId } />
                )}

                {salesforceData?.leads?.map(lead => (
                    <RecordListItem
                        actionLabelKey = 'dialog.unlink'
                        actionType = { BUTTON_TYPES.TERTIARY }
                        disabled = { unlinkingId !== null }
                        icon = { IconRecordLead }
                        isLoading = { unlinkingId === lead.leadId }
                        key = { lead.leadId }
                        metadata = { `${t('record.type.lead')}${lead.leadCompany ? ` \u2022 ${lead.leadCompany}` : ''}` }
                        name = { lead.leadName }
                        onAction = { handleUnlinkLead }
                        record = { lead.leadId } />
                ))}

                {salesforceData?.contacts?.map(contact => (
                    <RecordListItem
                        actionLabelKey = 'dialog.unlink'
                        actionType = { BUTTON_TYPES.TERTIARY }
                        disabled = { unlinkingId !== null }
                        icon = { IconRecordContact }
                        isLoading = { unlinkingId === contact.contactId }
                        key = { contact.contactId }
                        metadata = { t('record.type.contact') }
                        name = { contact.contactName }
                        onAction = { handleUnlinkContact }
                        record = { contact.contactId } />
                ))}

                {salesforceData?.deal && (
                    <RecordListItem
                        actionLabelKey = 'dialog.unlink'
                        actionType = { BUTTON_TYPES.TERTIARY }
                        disabled = { unlinkingId !== null }
                        icon = { IconRecordOpportunity }
                        isLoading = { unlinkingId === salesforceData.deal.opportunityId }
                        key = { salesforceData.deal.opportunityId }
                        metadata = { `${salesforceData.deal.opportunityStage}${
                            salesforceData.deal.amount !== undefined
                                ? ` \u2022 $${salesforceData.deal.amount.toLocaleString()}`
                                : ''
                        }` }
                        name = { salesforceData.deal.opportunityName }
                        onAction = { handleUnlinkOpportunity }
                        record = { salesforceData.deal.opportunityId } />
                )}
            </ul>
        </div>
    );
};

export default CurrentLinksSection;
