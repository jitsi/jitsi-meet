import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureResponderEvent } from 'react-native';
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
    executeLinkMeetingRequest,
    getRecentSessionRecords,
    getSessionRecordDetails,
    searchSessionRecords
} from './functions';

interface ISelectedRecord {
    id: string;
    name: string;
    onClick: (e?: React.MouseEvent | GestureResponderEvent) => void;
    type: string;
}

export const useSalesforceLinkDialog = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [ selectedRecord, setSelectedRecord ] = useState<ISelectedRecord | null>(null);
    const [ selectedRecordOwner, setSelectedRecordOwner ] = useState<{
        id: string; name: string; type: string; } | null>(null);
    const [ records, setRecords ] = useState([]);
    const [ isLoading, setLoading ] = useState(false);
    const [ searchTerm, setSearchTerm ] = useState<string | null>(null);
    const [ notes, setNotes ] = useState('');
    const [ hasRecordsErrors, setRecordsErrors ] = useState(false);
    const [ hasDetailsErrors, setDetailsErrors ] = useState(false);
    const conference = useSelector(getCurrentConference);
    const sessionId = conference?.getMeetingUniqueId();
    const { salesforceUrl = '' } = useSelector((state: IReduxState) => state['features/base/config']);
    const { jwt = '' } = useSelector((state: IReduxState) => state['features/base/jwt']);
    const showSearchResults = searchTerm && searchTerm.length > 1;
    const showNoResults = showSearchResults && records.length === 0;

    useEffect(() => {
        const fetchRecords = async () => {
            setRecordsErrors(false);
            setLoading(true);

            try {
                const text = showSearchResults ? searchTerm : null;
                const result = text
                    ? await searchSessionRecords(salesforceUrl, jwt, text)
                    : await getRecentSessionRecords(salesforceUrl, jwt);

                setRecords(result);
            } catch (error) {
                setRecordsErrors(true);
            }

            setLoading(false);
        };

        fetchRecords();
    }, [
        getRecentSessionRecords,
        jwt,
        salesforceUrl,
        searchSessionRecords,
        searchTerm
    ]);

    useEffect(() => {
        const fetchRecordDetails = async () => {
            setDetailsErrors(false);
            setSelectedRecordOwner(null);
            try {
                const result = await getSessionRecordDetails(salesforceUrl, jwt, selectedRecord);

                setSelectedRecordOwner({
                    id: result.id,
                    name: result.ownerName,
                    type: 'OWNER'
                });
            } catch (error) {
                setDetailsErrors(true);
            }
        };

        selectedRecord && fetchRecordDetails();
    }, [
        jwt,
        getSessionRecordDetails,
        salesforceUrl,
        selectedRecord
    ]);

    const linkMeeting = useCallback(async () => {
        dispatch(showNotification({
            titleKey: 'notify.linkToSalesforceProgress',
            uid: SALESFORCE_LINK_NOTIFICATION_ID,
            appearance: NOTIFICATION_TYPE.NORMAL
        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));

        try {
            await executeLinkMeetingRequest(salesforceUrl, jwt, sessionId, {
                id: selectedRecord?.id,
                type: selectedRecord?.type,
                notes
            });
            dispatch(hideNotification(SALESFORCE_LINK_NOTIFICATION_ID));
            dispatch(showNotification({
                titleKey: 'notify.linkToSalesforceSuccess',
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.SUCCESS
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } catch (error: any) {
            dispatch(hideNotification(SALESFORCE_LINK_NOTIFICATION_ID));
            dispatch(showNotification({
                titleKey: 'notify.linkToSalesforceError',
                descriptionKey: error?.messageKey && t(error.messageKey),
                uid: SALESFORCE_LINK_NOTIFICATION_ID,
                appearance: NOTIFICATION_TYPE.ERROR
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        }

    }, [
        executeLinkMeetingRequest,
        hideNotification,
        jwt,
        notes,
        salesforceUrl,
        selectedRecord,
        showNotification
    ]);

    return {
        hasDetailsErrors,
        hasRecordsErrors,
        isLoading,
        linkMeeting,
        notes,
        records,
        searchTerm,
        selectedRecord,
        selectedRecordOwner,
        setNotes,
        setSearchTerm,
        setSelectedRecord,
        showNoResults,
        showSearchResults
    };
};
