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
