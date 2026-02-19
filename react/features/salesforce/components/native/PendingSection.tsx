import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';

import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { IPendingAccount, IPendingDeal } from '../../types';

import styles from './styles';

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

/**
 * Component for displaying pending Salesforce suggestions (accounts or deals).
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const PendingSection = (props: IProps) => {
    const { t } = useTranslation();
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
        <View style = { styles.section as ViewStyle }>
            <View style = { styles.pendingHeader as ViewStyle }>
                <Text style = { styles.sectionTitle }>{title}</Text>
                <Button
                    disabled = { rejecting }
                    labelKey = 'dialog.dismissAll'
                    onClick = { onRejectAll }
                    type = { BUTTON_TYPES.TERTIARY } />
            </View>
            <Text style = { styles.sectionDescription }>{description}</Text>

            {isAccounts ? (
                (items as IPendingAccount[]).map(account => (
                    <View
                        key = { account.accountId }
                        style = { styles.listItem as ViewStyle }>
                        <View style = { styles.listItemInfo as ViewStyle }>
                            <Text
                                numberOfLines = { 1 }
                                style = { styles.listItemName }>
                                {account.accountName}
                            </Text>
                            {account.matchedEmailDomain && (
                                <Text style = { styles.listItemMeta }>
                                    {account.matchedEmailDomain}
                                </Text>
                            )}
                        </View>
                        <View style = { styles.listItemButtonContainer as ViewStyle }>
                            {confirmingId === account.accountId ? (
                                <View style = { styles.listItemSpinnerContainer as ViewStyle }>
                                    <LoadingIndicator size = 'small' />
                                </View>
                            ) : (
                                <Button
                                    disabled = { confirmingId !== null }
                                    labelKey = 'dialog.confirm'
                                    /* eslint-disable-next-line react/jsx-no-bind */
                                    onClick = { () => onConfirm(account.accountId) }
                                    type = { BUTTON_TYPES.PRIMARY } />
                            )}
                        </View>
                    </View>
                ))
            ) : (
                (items as IPendingDeal[]).map(deal => (
                    <View
                        key = { deal.opportunityId }
                        style = { styles.listItem as ViewStyle }>
                        <View style = { styles.listItemInfo as ViewStyle }>
                            <Text
                                numberOfLines = { 1 }
                                style = { styles.listItemName }>
                                {deal.opportunityName}
                            </Text>
                            <Text style = { styles.listItemMeta }>
                                {deal.opportunityStage}
                                {deal.amount !== undefined && ` \u2022 $${deal.amount.toLocaleString()}`}
                            </Text>
                        </View>
                        <View style = { styles.listItemButtonContainer as ViewStyle }>
                            {confirmingId === deal.opportunityId ? (
                                <View style = { styles.listItemSpinnerContainer as ViewStyle }>
                                    <LoadingIndicator size = 'small' />
                                </View>
                            ) : (
                                <Button
                                    disabled = { confirmingId !== null }
                                    labelKey = 'dialog.confirm'
                                    /* eslint-disable-next-line react/jsx-no-bind */
                                    onClick = { () => onConfirm(deal.opportunityId) }
                                    type = { BUTTON_TYPES.PRIMARY } />
                            )}
                        </View>
                    </View>
                ))
            )}
        </View>
    );
};

export default PendingSection;
