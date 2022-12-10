// @flow

import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {
    displayNameBackdrop: {
        alignSelf: 'center',
        backgroundColor: BaseTheme.palette.ui16,
        borderRadius: 4,
        paddingHorizontal: BaseTheme.spacing[3],
        paddingVertical: BaseTheme.spacing[1]
    },

    displayNamePadding: {
        padding: BaseTheme.spacing[1],
        paddingRight: 6
    },

    displayNameText: {
        color: BaseTheme.palette.text01,
        fontSize: 14,
        fontWeight: 'bold'
    }
};
