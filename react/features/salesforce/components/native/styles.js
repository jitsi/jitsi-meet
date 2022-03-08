import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {
    salesforceDialogContainer: {
        position: 'relative',
        flexDirection: 'column',
        flex: 1,
        display: 'flex',
        backgroundColor: BaseTheme.palette.ui01
    },
    recordsSearchContainer: {
        paddingHorizontal: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[3],
        backgroundColor: BaseTheme.palette.ui01,
        alignSelf: 'stretch',
        position: 'relative',
        marginTop: BaseTheme.spacing[3]
    },
    searchIcon: {
        color: BaseTheme.palette.text03,
        fontSize: 30,
        left: 22,
        position: 'absolute',
        top: 22,
        zIndex: 2
    },
    resultLabel: {
        backgroundColor: BaseTheme.palette.ui01,
        color: BaseTheme.palette.text03,
        fontSize: 15,
        margin: 0,
        paddingBottom: 8,
        paddingTop: 16
    },
    recordsSearch: {
        backgroundColor: BaseTheme.palette.field01,
        borderColor: BaseTheme.palette.border02,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 1,
        color: BaseTheme.palette.text01,
        paddingLeft: 44,
        paddingRight: 16,
        paddingVertical: 10,
        width: '100%'
    },
    recordsSpinner: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
    },
    noRecords: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: BaseTheme.spacing[3]
    },
    noRecordsText: {
        color: BaseTheme.palette.text03
    },
    recordsError: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingBottom: 30
    },
    recordsErrorText: {
        color: BaseTheme.palette.text03
    },
    recordList: {
        alignSelf: 'stretch',
        display: 'flex',
        listStyle: 'none',
        paddingVertical: BaseTheme.spacing[3],
        position: 'relative'
    },
    selectedRecord: {
        alignSelf: 'stretch',
        display: 'flex',
        paddingTop: BaseTheme.spacing[3],
        position: 'relative'
    },
    recordInfo: {
        backgroundColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.shape.borderRadius,
        display: 'flex',
        margin: BaseTheme.spacing[3],
        position: 'relative'
    },
    detailsError: {
        color: BaseTheme.palette.text03,
        padding: BaseTheme.spacing[3]
    },
    addNote: {
        color: BaseTheme.palette.field02,
        margin: BaseTheme.spacing[3]
    },
    notes: {
        alignItems: 'flex-start',
        backgroundColor: BaseTheme.palette.field01,
        borderColor: BaseTheme.palette.border02,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 1,
        color: BaseTheme.palette.field02,
        lineHeight: 18,
        marginHorizontal: BaseTheme.spacing[3],
        overflow: 'hidden',
        padding: BaseTheme.spacing[2],
        textAlignVertical: 'top'
    },
    cancelButton: {
        backgroundColor: BaseTheme.palette.action02,
        margin: BaseTheme.spacing[2]
    },
    linkButton: {
        backgroundColor: BaseTheme.palette.action01,
        marginBottom: BaseTheme.spacing[2],
        marginHorizontal: BaseTheme.spacing[2]
    },
    recordItem: {
        alignItems: 'center',
        display: 'flex',
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: BaseTheme.spacing[3]
    },
    recordTypeIcon: {
        alignItems: 'center',
        borderRadius: BaseTheme.shape.borderRadius,
        display: 'flex',
        height: 40,
        justifyContent: 'center',
        marginRight: BaseTheme.spacing[3],
        width: 40
    },
    recordIcon: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center'
    },
    recordDetails: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-around',
        overflow: 'hidden',
        paddingVertical: BaseTheme.spacing[3]
    },
    recordName: {
        color: BaseTheme.palette.text01,
        fontSize: 15,
        overflow: 'hidden'
    },
    recordType: {
        color: BaseTheme.palette.text01,
        fontSize: 13
    }
};
