// @flow

import { ColorSchemeRegistry, schemeColor } from '../../../base/color-scheme';
import { BoxModel } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const DROPBOX_LOGO = require('../../../../../images/dropboxLogo_square.png');
export const ICON_CLOUD = require('../../../../../images/icon-cloud.png');
export const ICON_INFO = require('../../../../../images/icon-info.png');
export const ICON_USERS = require('../../../../../images/icon-users.png');
export const JITSI_LOGO = require('../../../../../images/jitsiLogo_square.png');
export const TRACK_COLOR = BaseTheme.palette.ui15;


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

const baseHighlightDialogButton = {
    borderRadius: BaseTheme.shape.borderRadius,
    height: BaseTheme.spacing[7],
    flex: 1
};

const baseHighlightDialogLabel = {
    ...BaseTheme.typography.bodyShortBoldLarge,
    textTransform: 'none'
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
        backgroundColor: BaseTheme.palette.section01,
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
        flexDirection: 'row'
    },
    highlightDialogCancelButton: {
        ...baseHighlightDialogButton,
        backgroundColor: BaseTheme.palette.section01
    },
    highlightDialogHighlightButton: {
        ...baseHighlightDialogButton,
        backgroundColor: BaseTheme.palette.action01
    },
    highlightDialogCancelLabel: {
        ...baseHighlightDialogLabel,
        color: BaseTheme.palette.field01
    },
    highlightDialogHighlighLabel: {
        ...baseHighlightDialogLabel,
        color: BaseTheme.palette.text01
    },
    highlightDialogButtonsSpace: {
        width: 16,
        height: '100%'
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
        backgroundColor: BaseTheme.palette.warning03,
        marginBottom: BaseTheme.spacing[4],
        paddingHorizontal: BaseTheme.spacing[3]
    },

    loggedIn: {
        paddingBottom: _PADDING
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

    signButton: {
        backgroundColor: BaseTheme.palette.screen01Header,
        color: BaseTheme.palette.ui12,
        fontSize: 16,
        borderRadius: BaseTheme.shape.borderRadius,
        padding: BoxModel.padding * 0.5
    },

    switch: {
        color: BaseTheme.palette.ui12
    },

    title: {
        ...title
    },

    titleInfo: {
        ...title,
        color: BaseTheme.palette.text07Info
    },

    text: {
        color: schemeColor('text')
    }
});
