import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View, ViewStyle } from 'react-native';

import { IconSearch } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { StyleType } from '../../../base/styles/functions.any';
import Input from '../../../base/ui/components/native/Input';
import { useSalesforceLinkDialog } from '../../useSalesforceLinkDialog';

import { CurrentLinksSection } from './CurrentLinksSection';
import { PendingSection } from './PendingSection';
import { SearchResultsSection } from './SearchResultsSection';
import styles from './styles';

/**
 * Component that renders the Salesforce link dialog.
 *
 * @returns {React$Element<any>}
 */
const SalesforceLinkDialog = () => {
    const { t } = useTranslation();

    const {
        salesforceData,
        searchResults,
        hasSearchResults,
        hasPendingAccounts,
        hasPendingDeals,
        searchTerm,
        isLoading,
        isSearching,
        error,
        confirmingAccountId,
        confirmingDealId,
        rejectingAccounts,
        rejectingDeals,
        linkingId,
        unlinkingId,
        setSearchTerm,
        handleConfirmAccount,
        handleRejectAllAccounts,
        handleConfirmDeal,
        handleRejectAllDeals,
        handleLinkRecord,
        handleUnlinkRecord
    } = useSalesforceLinkDialog();

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
    }, [ setSearchTerm ]);

    const renderSearch = () => (
        <View style = { styles.searchContainer as ViewStyle }>
            <Input
                icon = { IconSearch }
                onChange = { handleSearchChange }
                placeholder = { t('dialog.searchInSalesforce') }
                value = { searchTerm } />
        </View>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style = { styles.spinnerContainer as ViewStyle }>
                    <LoadingIndicator />
                </View>
            );
        }

        return (
            <ScrollView
                bounces = { false }
                contentContainerStyle = { styles.scrollContent }>
                {/* Search spinner */}
                {isSearching && (
                    <View style = { styles.spinnerContainer as ViewStyle }>
                        <LoadingIndicator />
                    </View>
                )}

                {/* Search results */}
                {!isSearching && hasSearchResults && searchResults && (
                    <SearchResultsSection
                        linkingId = { linkingId }
                        onLink = { handleLinkRecord }
                        results = { searchResults } />
                )}

                {/* Error (only show when not searching and no results) */}
                {!isSearching && !hasSearchResults && error && (
                    <Text style = { styles.errorText }>
                        {error}
                    </Text>
                )}

                {/* Pending accounts (when not searching) */}
                {!searchTerm && hasPendingAccounts && salesforceData?.pendingAccounts && (
                    <PendingSection
                        confirmingId = { confirmingAccountId }
                        items = { salesforceData.pendingAccounts }
                        onConfirm = { handleConfirmAccount }
                        onRejectAll = { handleRejectAllAccounts }
                        rejecting = { rejectingAccounts }
                        type = 'accounts' />
                )}

                {/* Pending deals (when not searching) */}
                {!searchTerm && hasPendingDeals && salesforceData?.pendingDeals && (
                    <PendingSection
                        confirmingId = { confirmingDealId }
                        items = { salesforceData.pendingDeals }
                        onConfirm = { handleConfirmDeal }
                        onRejectAll = { handleRejectAllDeals }
                        rejecting = { rejectingDeals }
                        type = 'deals' />
                )}

                {/* Current links */}
                <CurrentLinksSection
                    onUnlink = { handleUnlinkRecord }
                    salesforceData = { salesforceData }
                    unlinkingId = { unlinkingId } />
            </ScrollView>
        );
    };

    return (
        <JitsiScreen style = { styles.salesforceDialogContainer as StyleType }>
            {renderSearch()}
            {renderContent()}
        </JitsiScreen>
    );
};

export default SalesforceLinkDialog;
