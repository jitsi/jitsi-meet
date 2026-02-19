import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { hideNotification, showNotification } from '../notifications/actions';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    SALESFORCE_LINK_NOTIFICATION_ID
} from '../notifications/constants';

import {
    confirmPendingAccount,
    confirmPendingDeal,
    getSessionSalesforceData,
    linkSession,
    rejectPendingAccounts,
    rejectPendingDeals,
    searchSalesforce,
    unlinkSession
} from './functions';
import {
    IAccountMatch,
    IContactMatch,
    ILeadMatch,
    IOpportunityMatch,
    ISalesforceData,
    ISearchResults,
    SalesforceObjectType
} from './types';

/**
 * Debounce helper.
 *
 * @param {Function} fn - Function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function}
 */
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: ReturnType<typeof setTimeout>;

    return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
}

export const useSalesforceLinkDialog = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    // Redux state
    const conference = useSelector(getCurrentConference);
    const sessionId = conference?.getMeetingUniqueId();
    const { salesforceUrl = '' } = useSelector((state: IReduxState) => state['features/base/config']);
    const { jwt = '' } = useSelector((state: IReduxState) => state['features/base/jwt']);

    // Component state
    const [ salesforceData, setSalesforceData ] = useState<ISalesforceData | null>(null);
    const [ searchResults, setSearchResults ] = useState<ISearchResults | null>(null);
    const [ searchTerm, setSearchTerm ] = useState('');
    const [ isLoading, setIsLoading ] = useState(true);
    const [ isSearching, setIsSearching ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);

    // Loading states for actions
    const [ confirmingAccountId, setConfirmingAccountId ] = useState<string | null>(null);
    const [ confirmingDealId, setConfirmingDealId ] = useState<string | null>(null);
    const [ rejectingAccounts, setRejectingAccounts ] = useState(false);
    const [ rejectingDeals, setRejectingDeals ] = useState(false);
    const [ linkingId, setLinkingId ] = useState<string | null>(null);
    const [ unlinkingId, setUnlinkingId ] = useState<string | null>(null);

    /**
     * Refreshes the Salesforce data for the current session.
     */
    const refreshSalesforceData = useCallback(async () => {
        if (!sessionId) {
            return;
        }

        try {
            const data = await getSessionSalesforceData(salesforceUrl, jwt, sessionId);

            setSalesforceData(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch Salesforce data:', err);
            setError(err?.error || t('dialog.salesforceDataError'));
        }
    }, [ salesforceUrl, jwt, sessionId, t ]);

    /**
     * Performs a search in Salesforce.
     */
    const performSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults(null);

            return;
        }

        setIsSearching(true);

        try {
            const results = await searchSalesforce(salesforceUrl, jwt, query);

            setSearchResults(results);
            setError(null);
        } catch (err: any) {
            console.error('Salesforce search failed:', err);
            setError(err?.error || t('dialog.searchResultsError'));
            setSearchResults(null);
        } finally {
            setIsSearching(false);
        }
    }, [ salesforceUrl, jwt, t ]);

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce(performSearch, 500),
        [ performSearch ]
    );

    // Track if component is mounted
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        return () => {
            isMounted.current = false;
        };
    }, []);

    // Fetch Salesforce data on mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await refreshSalesforceData();

            if (isMounted.current) {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [ refreshSalesforceData ]);

    // Trigger search when search term changes
    useEffect(() => {
        if (searchTerm.length >= 2) {
            debouncedSearch(searchTerm);
        } else {
            setSearchResults(null);
        }
    }, [ searchTerm, debouncedSearch ]);

    /**
     * Handles confirming a pending account.
     */
    const handleConfirmAccount = useCallback(async (accountId: string) => {
        if (!sessionId) {
            return;
        }

        setConfirmingAccountId(accountId);

        try {
            const result = await confirmPendingAccount(salesforceUrl, jwt, sessionId, accountId);

            if (result.success) {
                dispatch(showNotification({
                    titleKey: 'notify.confirmAccountSuccess',
                    uid: SALESFORCE_LINK_NOTIFICATION_ID,
                    appearance: NOTIFICATION_TYPE.SUCCESS
                }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

                await refreshSalesforceData();
            }
        } catch (err: any) {
            dispatch(showNotification({
                titleKey: 'notify.confirmAccountError',
                descriptionKey: err?.error,
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } finally {
            setConfirmingAccountId(null);
        }
    }, [ salesforceUrl, jwt, sessionId, dispatch, refreshSalesforceData ]);

    /**
     * Handles rejecting all pending accounts.
     */
    const handleRejectAllAccounts = useCallback(async () => {
        if (!sessionId) {
            return;
        }

        setRejectingAccounts(true);

        try {
            await rejectPendingAccounts(salesforceUrl, jwt, sessionId);
            dispatch(showNotification({
                titleKey: 'notify.dismissSuccess',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.SUCCESS
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

            await refreshSalesforceData();
        } catch (err: any) {
            dispatch(showNotification({
                titleKey: 'notify.dismissError',
                descriptionKey: err?.error,
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } finally {
            setRejectingAccounts(false);
        }
    }, [ salesforceUrl, jwt, sessionId, dispatch, refreshSalesforceData ]);

    /**
     * Handles confirming a pending deal.
     */
    const handleConfirmDeal = useCallback(async (opportunityId: string) => {
        if (!sessionId) {
            return;
        }

        setConfirmingDealId(opportunityId);

        try {
            const result = await confirmPendingDeal(salesforceUrl, jwt, sessionId, opportunityId);

            if (result.success) {
                dispatch(showNotification({
                    titleKey: 'notify.confirmDealSuccess',
                    uid: SALESFORCE_LINK_NOTIFICATION_ID,
                    appearance: NOTIFICATION_TYPE.SUCCESS
                }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

                await refreshSalesforceData();
            }
        } catch (err: any) {
            dispatch(showNotification({
                titleKey: 'notify.confirmDealError',
                descriptionKey: err?.error,
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } finally {
            setConfirmingDealId(null);
        }
    }, [ salesforceUrl, jwt, sessionId, dispatch, refreshSalesforceData ]);

    /**
     * Handles rejecting all pending deals.
     */
    const handleRejectAllDeals = useCallback(async () => {
        if (!sessionId) {
            return;
        }

        setRejectingDeals(true);

        try {
            await rejectPendingDeals(salesforceUrl, jwt, sessionId);
            dispatch(showNotification({
                titleKey: 'notify.dismissSuccess',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.SUCCESS
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

            await refreshSalesforceData();
        } catch (err: any) {
            dispatch(showNotification({
                titleKey: 'notify.dismissError',
                descriptionKey: err?.error,
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } finally {
            setRejectingDeals(false);
        }
    }, [ salesforceUrl, jwt, sessionId, dispatch, refreshSalesforceData ]);

    /**
     * Handles linking a record from search results.
     */
    const handleLinkRecord = useCallback(async (
            type: SalesforceObjectType,
            data: IAccountMatch | ILeadMatch | IContactMatch | IOpportunityMatch
    ) => {
        if (!sessionId) {
            return;
        }

        const id = type === 'Account' ? (data as IAccountMatch).accountId
            : type === 'Lead' ? (data as ILeadMatch).leadId
                : type === 'Contact' ? (data as IContactMatch).contactId
                    : (data as IOpportunityMatch).opportunityId;

        setLinkingId(id);

        dispatch(showNotification({
            titleKey: 'notify.linkToSalesforceProgress',
            uid: SALESFORCE_LINK_NOTIFICATION_ID,
            appearance: NOTIFICATION_TYPE.NORMAL
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

        try {
            await linkSession(salesforceUrl, jwt, sessionId, type, data);

            dispatch(hideNotification(SALESFORCE_LINK_NOTIFICATION_ID));
            dispatch(showNotification({
                titleKey: 'notify.linkToSalesforceSuccess',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.SUCCESS
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

            // Clear search and refresh data
            setSearchTerm('');
            setSearchResults(null);
            await refreshSalesforceData();
        } catch (err: any) {
            dispatch(hideNotification(SALESFORCE_LINK_NOTIFICATION_ID));
            dispatch(showNotification({
                titleKey: 'notify.linkToSalesforceError',
                descriptionKey: err?.error,
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } finally {
            setLinkingId(null);
        }
    }, [ salesforceUrl, jwt, sessionId, dispatch, refreshSalesforceData ]);

    /**
     * Handles unlinking a record from the session.
     */
    const handleUnlinkRecord = useCallback(async (type: SalesforceObjectType, id: string) => {
        if (!sessionId) {
            return;
        }

        setUnlinkingId(id);

        try {
            await unlinkSession(salesforceUrl, jwt, sessionId, type, id);

            dispatch(showNotification({
                titleKey: 'notify.unlinkFromSalesforceSuccess',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.SUCCESS
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

            await refreshSalesforceData();
        } catch (err: any) {
            dispatch(showNotification({
                titleKey: 'notify.unlinkFromSalesforceError',
                descriptionKey: err?.error,
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } finally {
            setUnlinkingId(null);
        }
    }, [ salesforceUrl, jwt, sessionId, dispatch, refreshSalesforceData ]);

    // Filter out already-linked items from search results
    const filteredSearchResults = useMemo(() => {
        if (!searchResults || !salesforceData) {
            return searchResults;
        }

        return {
            accounts: searchResults.accounts.filter(
                account => salesforceData.account?.accountId !== account.accountId
            ),
            leads: searchResults.leads.filter(
                lead => !salesforceData.leads?.some(l => l.leadId === lead.leadId)
            ),
            contacts: searchResults.contacts.filter(
                contact => !salesforceData.contacts?.some(c => c.contactId === contact.contactId)
            ),
            opportunities: searchResults.opportunities.filter(
                opp => salesforceData.deal?.opportunityId !== opp.opportunityId
            )
        };
    }, [ searchResults, salesforceData ]);

    const hasSearchResults = filteredSearchResults
        && (filteredSearchResults.accounts.length > 0
            || filteredSearchResults.leads.length > 0
            || filteredSearchResults.contacts.length > 0
            || filteredSearchResults.opportunities.length > 0);

    const hasPendingAccounts = (salesforceData?.pendingAccounts?.length ?? 0) > 0;
    const hasPendingDeals = (salesforceData?.pendingDeals?.length ?? 0) > 0;

    return {
        // Data
        salesforceData,
        searchResults: filteredSearchResults,
        hasSearchResults,
        hasPendingAccounts,
        hasPendingDeals,

        // State
        searchTerm,
        isLoading,
        isSearching,
        error,

        // Action loading states
        confirmingAccountId,
        confirmingDealId,
        rejectingAccounts,
        rejectingDeals,
        linkingId,
        unlinkingId,

        // Setters
        setSearchTerm,

        // Actions
        handleConfirmAccount,
        handleRejectAllAccounts,
        handleConfirmDeal,
        handleRejectAllDeals,
        handleLinkRecord,
        handleUnlinkRecord,
        refreshSalesforceData
    };
};
