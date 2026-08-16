import React from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Button from '../../../base/ui/components/web/Button';
import Spinner from '../../../base/ui/components/web/Spinner';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { IPendingAccount, IPendingDeal } from '../../types';

interface IPendingAccountsSectionProps {
    confirmingId: string | null;
    items: IPendingAccount[];
    onConfirm: (accountId: string) => void;
    onRejectAll: () => void;
    rejecting: boolean;
    type: 'accounts';
}

interface IPendingDealsSectionProps {
    confirmingId: string | null;
    items: IPendingDeal[];
    onConfirm: (opportunityId: string) => void;
    onRejectAll: () => void;
    rejecting: boolean;
    type: 'deals';
}

type IProps = IPendingAccountsSectionProps | IPendingDealsSectionProps;

const useStyles = makeStyles()(theme => {
    return {
        section: {
            marginBottom: '24px'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
        },
        title: {
            fontSize: '0.875rem',
            fontWeight: 600,
            margin: 0
        },
        description: {
            fontSize: '0.75rem',
            color: theme.palette.text03,
            marginBottom: '12px'
        },
        list: {
            listStyle: 'none',
            margin: 0,
            padding: 0
        },
        item: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: theme.palette.inputFieldBackground,
            borderRadius: theme.shape.borderRadius,
            marginBottom: '8px',

            '&:last-child': {
                marginBottom: 0
            }
        },
        itemInfo: {
            flex: 1,
            minWidth: 0
        },
        itemName: {
            fontSize: '0.875rem',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        itemMeta: {
            fontSize: '0.75rem',
            color: theme.palette.text03,
            marginTop: '2px'
        },
        buttonContainer: {
            marginLeft: '12px',
            flexShrink: 0
        },
        spinnerContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '70px'
        }
    };
});

/**
 * Component for displaying pending Salesforce suggestions (accounts or deals).
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const PendingSection = (props: IProps) => {
    const { t } = useTranslation();
    const { classes } = useStyles();

    const { items, confirmingId, rejecting, onConfirm, onRejectAll, type } = props;

    if (items.length === 0) {
        return null;
    }

    const isAccounts = type === 'accounts';
    const title = isAccounts
        ? t('dialog.suggestedAccounts')
        : t('dialog.suggestedDeals');
    const description = isAccounts
        ? t('dialog.pendingDescription')
        : t('dialog.pendingDealsDescription');

    return (
        <div className = { classes.section }>
            <div className = { classes.header }>
                <h3 className = { classes.title }>{title}</h3>
                <Button
                    disabled = { rejecting }
                    labelKey = 'dialog.dismissAll'
                    onClick = { onRejectAll }
                    size = 'small'
                    type = { BUTTON_TYPES.TERTIARY } />
            </div>
            <p className = { classes.description }>{description}</p>
            <ul className = { classes.list }>
                {isAccounts ? (
                    (items as IPendingAccount[]).map(account => (
                        <li
                            className = { classes.item }
                            key = { account.accountId }>
                            <div className = { classes.itemInfo }>
                                <div className = { classes.itemName }>{account.accountName}</div>
                                {account.matchedEmailDomain && (
                                    <div className = { classes.itemMeta }>{account.matchedEmailDomain}</div>
                                )}
                            </div>
                            <div className = { classes.buttonContainer }>
                                {confirmingId === account.accountId ? (
                                    <div className = { classes.spinnerContainer }>
                                        <Spinner size = 'small' />
                                    </div>
                                ) : (
                                    <Button
                                        disabled = { confirmingId !== null }
                                        labelKey = 'dialog.confirm'
                                        /* eslint-disable-next-line react/jsx-no-bind */
                                        onClick = { () => onConfirm(account.accountId) }
                                        size = 'small'
                                        type = { BUTTON_TYPES.PRIMARY } />
                                )}
                            </div>
                        </li>
                    ))
                ) : (
                    (items as IPendingDeal[]).map(deal => (
                        <li
                            className = { classes.item }
                            key = { deal.opportunityId }>
                            <div className = { classes.itemInfo }>
                                <div className = { classes.itemName }>{deal.opportunityName}</div>
                                <div className = { classes.itemMeta }>
                                    {deal.opportunityStage}
                                    {deal.amount !== undefined && ` \u2022 $${deal.amount.toLocaleString()}`}
                                </div>
                            </div>
                            <div className = { classes.buttonContainer }>
                                {confirmingId === deal.opportunityId ? (
                                    <div className = { classes.spinnerContainer }>
                                        <Spinner size = 'small' />
                                    </div>
                                ) : (
                                    <Button
                                        disabled = { confirmingId !== null }
                                        labelKey = 'dialog.confirm'
                                        /* eslint-disable-next-line react/jsx-no-bind */
                                        onClick = { () => onConfirm(deal.opportunityId) }
                                        size = 'small'
                                        type = { BUTTON_TYPES.PRIMARY } />
                                )}
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default PendingSection;
