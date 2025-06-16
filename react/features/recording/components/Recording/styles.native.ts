import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import { schemeColor } from '../../../base/color-scheme/functions';
import { BoxModel } from '../../../base/styles/components/styles/BoxModel';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/* eslint-disable @typescript-eslint/no-var-requires */
export const DROPBOX_LOGO = require('../../../../../images/dropboxLogo_square.png');
export const ICON_CLOUD = require('../../../../../images/icon-cloud.png');
export const ICON_INFO = require('../../../../../images/icon-info.png');
export const ICON_USERS = require('../../../../../images/icon-users.png');
export const LOCAL_RECORDING = require('../../../../../images/downloadLocalRecording.png');
export const TRACK_COLOR = BaseTheme.palette.ui07;
/* eslint-enable @typescript-eslint/no-var-requires */

// XXX The "standard" {@code BoxModel.padding} has been deemed insufficient in
// the special case(s) of the recording feature below.
const _PADDING = BoxModel.padding * 1.5;

const header = {
    alignItems: 'center',
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: _PADDING,
    paddingTop: _PADDING
};

const recordingIcon = {
    width: BaseTheme.spacing[4],
    height: BaseTheme.spacing[4]
};

const title = {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    paddingLeft: BoxModel.padding
};

export default {
    /**
     * Container for the StartRecordingDialog screen.
     */
    startRecodingContainer: {
        backgroundColor: BaseTheme.palette.ui01,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        paddingTop: BaseTheme.spacing[3]
    },

    /**
     * Label for the start recording button.
     */
    startRecordingLabel: {
        color: BaseTheme.palette.text01,
        marginRight: 12
    },
    highlightButton: {
        backgroundColor: BaseTheme.palette.ui09,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: BaseTheme.spacing[0],
        marginBottom: BaseTheme.spacing[0],
        marginRight: BaseTheme.spacing[1]
    },
    highlightButtonText: {
        color: BaseTheme.palette.field01,
        paddingLeft: BaseTheme.spacing[2],
        ...BaseTheme.typography.labelBold
    },
    highlightDialog: {
        paddingLeft: BaseTheme.spacing[3],
        paddingRight: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[4],
        paddingBottom: BaseTheme.spacing[7]
    },
    highlightDialogHeading: {
        ...BaseTheme.typography.heading5,
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[3]
    },
    highlightDialogText: {
        ...BaseTheme.typography.bodyLongRegularLarge,
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[5]
    },
    highlightDialogButtonsContainer: {
        display: 'flex',
        flexDirection: 'column-reverse'
    },
    highlightDialogButtonsSpace: {
        height: 16,
        width: '100%'
    }

};

/**
 * Color schemed styles for the @{code StartRecordingDialogContent} component.
 */
ColorSchemeRegistry.register('StartRecordingDialogContent', {

    container: {
        flex: 0,
        flexDirection: 'column'
    },

    controlDisabled: {
        opacity: 0.5
    },

    header: {
        ...header,
        marginHorizontal: BaseTheme.spacing[3]
    },

    headerIntegrations: {
        ...header,
        paddingHorizontal: BaseTheme.spacing[3]
    },

    headerInfo: {
        ...header,
        backgroundColor: BaseTheme.palette.warning02,
        marginBottom: BaseTheme.spacing[4],
        paddingHorizontal: BaseTheme.spacing[3]
    },

    loggedIn: {
        paddingHorizontal: _PADDING
    },

    recordingIcon: {
        ...recordingIcon
    },

    recordingInfoIcon: {
        ...recordingIcon
    },

    recordingText: {
        color: BaseTheme.palette.text01
    },

    switch: {
        color: BaseTheme.palette.ui10
    },

    title: {
        ...title
    },

    titleInfo: {
        ...title,
        color: BaseTheme.palette.ui01
    },

    text: {
        color: schemeColor('text')
    }
});
