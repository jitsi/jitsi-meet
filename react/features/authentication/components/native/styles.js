import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import { BoxModel } from '../../../base/styles';

/**
 * The styles of the authentication feature.
 */
ColorSchemeRegistry.register('LoginDialog', {

    /**
     * The style of {@code Text} rendered by the {@code Dialog}s of the
     * feature authentication.
     */
    dialogText: {
        margin: BoxModel.margin,
        marginTop: BoxModel.margin * 2
    },

    /**
     * The style used when an error message is rendered.
     */
    errorMessage: {
        color: schemeColor('errorText')
    },

    /**
     * The style of {@code LoginDialog}.
     */
    loginDialog: {
        flex: 0,
        flexDirection: 'column',
        marginBottom: BoxModel.margin,
        marginTop: BoxModel.margin
    },

    /**
     * The style used then a progress message is rendered.
     */
    progressMessage: {
        color: schemeColor('text')
    }
});
