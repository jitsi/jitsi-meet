import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../base/dialog/actions';
import Icon from '../../../base/icons/components/Icon';
import { IconSearch } from '../../../base/icons/svg';
import { getFieldValue } from '../../../base/react/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import Spinner from '../../../base/ui/components/web/Spinner';
import { useSalesforceLinkDialog } from '../../useSalesforceLinkDialog';

import { CurrentLinksSection } from './CurrentLinksSection';
import { PendingSection } from './PendingSection';
import { SearchResultsSection } from './SearchResultsSection';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            minHeight: '400px',
            maxHeight: '500px',
            overflowY: 'auto',
            position: 'relative'
        },
        searchContainer: {
            position: 'relative',
            padding: '1px',
            marginBottom: '16px'
        },
        searchIcon: {
            display: 'block',
            position: 'absolute',
            color: theme.palette.salesforceSearchIcon,
            left: 16,
            top: 10,
            width: 20,
            height: 20
        },
        searchInput: {
            backgroundColor: theme.palette.salesforceSearchBackground,
            border: '1px solid',
            borderRadius: theme.shape.borderRadius,
            borderColor: theme.palette.salesforceSearchBorder,
            color: theme.palette.salesforceSearchText,
            padding: '10px 16px 10px 44px',
            width: '100%',
            height: 40,
            '&::placeholder': {
                color: theme.palette.salesforceSearchPlaceholder,
                ...theme.typography.bodyShortRegular
            }
        },
        spinner: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 0',
            boxSizing: 'border-box'
        },
        error: {
            textAlign: 'center',
            color: theme.palette.textError,
            padding: '24px'
        }
    };
});


/**
 * Component that renders the Salesforce link dialog.
 *
 * @returns {React$Element<any>}
 */
function SalesforceLinkDialog() {
    const { t } = useTranslation();
    const { classes, theme } = useStyles();
    const dispatch = useDispatch();

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

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = getFieldValue(event);

        setSearchTerm(value);
    }, [ setSearchTerm ]);

    const handleSearchKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    }, []);

    const handleClose = useCallback(() => {
        dispatch(hideDialog());
    }, [ dispatch ]);

    const renderSearch = () => (
        <div className = { classes.searchContainer }>
            <Icon
                className = { classes.searchIcon }
                color = { theme.palette.icon03 }
                src = { IconSearch } />
            <input
                autoComplete = 'off'
                autoFocus = { true }
                className = { classes.searchInput }
                name = 'salesforceSearch'
                onChange = { handleSearchChange }
                onKeyDown = { handleSearchKeyDown }
                placeholder = { t('dialog.searchInSalesforce') }
                tabIndex = { 0 }
                value = { searchTerm } />
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className = { classes.spinner }>
                    <Spinner />
                </div>
            );
        }

        return (
            <>
                {/* Search spinner */}
                {isSearching && (
                    <div className = { classes.spinner }>
                        <Spinner />
                    </div>
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
                    <div className = { classes.error }>
                        {error}
                    </div>
                )}

                {/* Pending suggestions (when not searching) */}
                {!searchTerm && hasPendingAccounts && salesforceData?.pendingAccounts && (
                    <PendingSection
                        confirmingId = { confirmingAccountId }
                        items = { salesforceData.pendingAccounts }
                        onConfirm = { handleConfirmAccount }
                        onRejectAll = { handleRejectAllAccounts }
                        rejecting = { rejectingAccounts }
                        type = 'accounts' />
                )}

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
            </>
        );
    };

    return (
        <Dialog
            cancel = {{ hidden: true }}
            disableEnter = { true }
            ok = {{ hidden: true }}
            onCancel = { handleClose }
            titleKey = 'dialog.linkMeetingTitle'>
            <div className = { classes.container }>
                {renderSearch()}
                {renderContent()}
            </div>
        </Dialog>
    );
}

export default SalesforceLinkDialog;
