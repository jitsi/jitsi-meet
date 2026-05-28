import { TextStyle, ViewStyle } from 'react-native';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

interface IStyles {
    currentLinksSection: ViewStyle;
    errorText: TextStyle;
    groupTitle: TextStyle;
    listItem: ViewStyle;
    listItemButtonContainer: ViewStyle;
    listItemCompact: ViewStyle;
    listItemIcon: ViewStyle;
    listItemInfo: ViewStyle;
    listItemMeta: TextStyle;
    listItemName: TextStyle;
    listItemSpinnerContainer: ViewStyle;
    noResultsContainer: ViewStyle;
    noResultsText: TextStyle;
    pendingHeader: ViewStyle;
    salesforceDialogContainer: ViewStyle;
    scrollContent: ViewStyle;
    searchContainer: ViewStyle;
    section: ViewStyle;
    sectionDescription: TextStyle;
    sectionTitle: TextStyle;
    spinnerContainer: ViewStyle;
}

const styles: IStyles = {
    // Main container
    salesforceDialogContainer: {
        position: 'relative',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: BaseTheme.palette.ui01
    },

    // Search
    searchContainer: {
        alignSelf: 'stretch',
        backgroundColor: BaseTheme.palette.ui01,
        paddingHorizontal: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[2],
        paddingBottom: BaseTheme.spacing[3]
    },

    // Loading/spinner
    spinnerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: BaseTheme.spacing[6]
    },

    // Error
    errorText: {
        color: BaseTheme.palette.textError,
        textAlign: 'center',
        padding: BaseTheme.spacing[4]
    },

    // No results
    noResultsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: BaseTheme.spacing[4]
    },
    noResultsText: {
        color: BaseTheme.palette.text03,
        textAlign: 'center'
    },

    // Section styles
    section: {
        marginBottom: BaseTheme.spacing[4],
        paddingHorizontal: BaseTheme.spacing[3]
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[2]
    },
    sectionDescription: {
        fontSize: 13,
        color: BaseTheme.palette.text03,
        marginBottom: BaseTheme.spacing[3]
    },

    // Pending section header
    pendingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: BaseTheme.spacing[2]
    },

    // Current links section
    currentLinksSection: {
        marginTop: BaseTheme.spacing[4],
        paddingTop: BaseTheme.spacing[3],
        paddingHorizontal: BaseTheme.spacing[3],
        borderTopWidth: 1,
        borderTopColor: BaseTheme.palette.ui05
    },

    // Group title (for search results)
    groupTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: BaseTheme.palette.text03,
        textTransform: 'uppercase',
        marginTop: BaseTheme.spacing[3],
        marginBottom: BaseTheme.spacing[2],
        paddingHorizontal: BaseTheme.spacing[3]
    },

    // RecordListItem styles
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.shape.borderRadius,
        padding: BaseTheme.spacing[3],
        marginBottom: BaseTheme.spacing[2],
        marginHorizontal: BaseTheme.spacing[3]
    },
    listItemCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: BaseTheme.spacing[2]
    },
    listItemIcon: {
        width: 24,
        height: 24,
        marginRight: BaseTheme.spacing[3]
    },
    listItemInfo: {
        flex: 1
    },
    listItemName: {
        fontSize: 15,
        color: BaseTheme.palette.text01
    },
    listItemMeta: {
        fontSize: 13,
        color: BaseTheme.palette.text03,
        marginTop: 2
    },
    listItemButtonContainer: {
        marginLeft: BaseTheme.spacing[3]
    },
    listItemSpinnerContainer: {
        width: 70,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // Scroll container
    scrollContent: {
        flexGrow: 1
    }
};

export default styles;
