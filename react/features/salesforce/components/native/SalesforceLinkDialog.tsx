import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, SafeAreaView, ScrollView, Text, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconSearch } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { CONTENT_HEIGHT_OFFSET, LIST_HEIGHT_OFFSET, NOTES_LINES, NOTES_MAX_LENGTH } from '../../constants';
import { useSalesforceLinkDialog } from '../../useSalesforceLinkDialog';

import { RecordItem } from './RecordItem';
import styles from './styles';

/**
 * Component that renders the Salesforce link dialog.
 *
 * @returns {React$Element<any>}
 */
const SalesforceLinkDialog = () => {
    const { t } = useTranslation();
    const { clientHeight } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const {
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
    } = useSalesforceLinkDialog();

    const handlePress = useCallback(() => {
        navigate(screen.conference.main);
        selectedRecord && linkMeeting();
    }, [ navigate, linkMeeting ]);

    const renderSpinner = () => (
        <View style = { [ styles.recordsSpinner, { height: clientHeight - CONTENT_HEIGHT_OFFSET } ] as ViewStyle[] }>
            <LoadingIndicator />
        </View>
    );

    const renderDetailsErrors = () => (
        <Text style = { styles.detailsError }>
            {t('dialog.searchResultsDetailsError')}
        </Text>
    );

    const renderSelection = () => (
        <SafeAreaView>
            <ScrollView
                bounces = { false }
                style = { [ styles.selectedRecord, { height: clientHeight - CONTENT_HEIGHT_OFFSET } ] as ViewStyle[] }>
                <View style = { styles.recordInfo as ViewStyle }>
                    <RecordItem { ...selectedRecord } />
                    { selectedRecordOwner && <RecordItem { ...selectedRecordOwner } /> }
                    { hasDetailsErrors && renderDetailsErrors() }
                </View>
                <Text style = { styles.addNote }>
                    {t('dialog.addOptionalNote')}
                </Text>
                <Input
                    customStyles = {{ container: styles.notes }}
                    maxLength = { NOTES_MAX_LENGTH }
                    minHeight = { Platform.OS === 'ios' && NOTES_LINES ? 20 * NOTES_LINES : undefined }
                    multiline = { true }
                    numberOfLines = { Platform.OS === 'ios' ? undefined : NOTES_LINES }
                    /* eslint-disable-next-line react/jsx-no-bind */
                    onChange = { value => setNotes(value) }
                    placeholder = { t('dialog.addMeetingNote') }
                    value = { notes } />
            </ScrollView>
        </SafeAreaView>
    );

    const renderRecordsSearch = () => (
        <View style = { styles.recordsSearchContainer as ViewStyle }>
            <Input
                icon = { IconSearch }
                maxLength = { NOTES_MAX_LENGTH }
                /* eslint-disable-next-line react/jsx-no-bind */
                onChange = { value => setSearchTerm(value) }
                placeholder = { t('dialog.searchInSalesforce') }
                value = { searchTerm ?? '' } />
            {(!isLoading && !hasRecordsErrors) && (
                <Text style = { styles.resultLabel }>
                    {showSearchResults
                        ? t('dialog.searchResults', { count: records.length })
                        : t('dialog.recentlyUsedObjects')
                    }
                </Text>
            )}
        </View>
    );

    const renderNoRecords = () => showNoResults && (
        <View style = { [ styles.noRecords, { height: clientHeight - CONTENT_HEIGHT_OFFSET } ] as ViewStyle[] }>
            <Text style = { styles.noRecordsText }>
                {t('dialog.searchResultsNotFound')}
            </Text>
            <Text style = { styles.noRecordsText }>
                {t('dialog.searchResultsTryAgain')}
            </Text>
        </View>
    );

    const renderRecordsError = () => (
        <View style = { [ styles.recordsError, { height: clientHeight - CONTENT_HEIGHT_OFFSET } ] as ViewStyle[] }>
            <Text style = { styles.recordsErrorText }>
                {t('dialog.searchResultsError')}
            </Text>
        </View>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSpinner();
        }
        if (hasRecordsErrors) {
            return renderRecordsError();
        }
        if (showNoResults) {
            return renderNoRecords();
        }
        if (selectedRecord) {
            return renderSelection();
        }

        return (
            <SafeAreaView>
                <ScrollView
                    bounces = { false }
                    style = { [ styles.recordList, { height: clientHeight - LIST_HEIGHT_OFFSET } ] as ViewStyle[] }>
                    {records.map((item: any) => (
                        <RecordItem
                            key = { `record-${item.id}` }
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onClick = { () => setSelectedRecord(item) }
                            { ...item } />
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    };

    return (
        <JitsiScreen style = { styles.salesforceDialogContainer }>
            <View>
                {!selectedRecord && renderRecordsSearch()}
                {renderContent()}
            </View>
            {
                selectedRecord
                && <View>
                    <Button
                        labelKey = 'dialog.Cancel'
                        /* eslint-disable-next-line react/jsx-no-bind */
                        onClick = { () => setSelectedRecord(null) }
                        style = { styles.cancelButton }
                        type = { BUTTON_TYPES.SECONDARY } />
                    <Button
                        labelKey = 'dialog.linkMeeting'
                        onClick = { handlePress }
                        style = { styles.linkButton }
                        type = { BUTTON_TYPES.PRIMARY } />
                </View>
            }
        </JitsiScreen>
    );
};

export default SalesforceLinkDialog;
