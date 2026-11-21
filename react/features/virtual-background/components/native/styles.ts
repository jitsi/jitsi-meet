import { StyleSheet } from 'react-native';

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const { palette: PALETTE } = BaseTheme;

export default StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        position: 'relative'
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    title: {
        color: PALETTE.text01,
        fontSize: 20,
        fontWeight: '700'
    },
    close: {
        color: PALETTE.action01,
        fontSize: 16,
        fontWeight: '600',
        padding: 8
    },
    preview: {
        aspectRatio: 16 / 9,
        backgroundColor: PALETTE.ui02,
        borderRadius: 16,
        marginBottom: 8,
        overflow: 'hidden'
    },
    previewImage: {
        height: '100%',
        width: '100%'
    },
    placeholder: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center'
    },
    helper: {
        color: PALETTE.text02,
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 16
    },
    loadingArea: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300
    },
    loadingOverlay: {
        alignItems: 'center',
        backgroundColor: PALETTE.dialogBackground,
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 10
    },
    error: {
        color: PALETTE.actionDanger,
        fontSize: 13,
        marginBottom: 12
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    option: {
        backgroundColor: PALETTE.ui02,
        borderColor: PALETTE.ui03,
        borderRadius: 14,
        borderWidth: 2,
        marginBottom: 12,
        overflow: 'hidden',
        width: '48%'
    },
    selected: {
        borderColor: PALETTE.action01
    },
    thumbnail: {
        alignItems: 'center',
        aspectRatio: 16 / 10,
        backgroundColor: PALETTE.ui04,
        justifyContent: 'center',
        overflow: 'hidden'
    },
    thumbnailImage: {
        height: '100%',
        width: '100%'
    },
    thumbnailText: {
        color: PALETTE.text01,
        fontSize: 26,
        fontWeight: '600'
    },
    optionFooter: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 46,
        paddingHorizontal: 10
    },
    optionLabel: {
        color: PALETTE.text01,
        flex: 1,
        fontSize: 13,
        fontWeight: '600'
    },
    checked: {
        color: PALETTE.action01,
        fontSize: 19,
        fontWeight: '700'
    }
});
