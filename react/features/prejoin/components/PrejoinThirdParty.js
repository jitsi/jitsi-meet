// @flow

import { withStyles } from '@material-ui/styles';
import clsx from 'clsx';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { isVideoMutedByUser } from '../../base/media';
import { PreMeetingScreen } from '../../base/premeeting';
import { connect } from '../../base/redux';
import { getLocalJitsiVideoTrack } from '../../base/tracks';
import { isDeviceStatusVisible } from '../functions';

type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * Indicates the className that needs to be applied.
    */
    className: string,

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean,

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack: ?Object
};

/**
 * Creates the styles for the component.
 *
 * @returns {Object}
 */
const styles = () => {
    const sidePanelWidth = '300px';

    return {
        root: {
            flexDirection: 'column-reverse',

            '& .content': {
                height: 'auto',
                margin: '0 auto',
                width: 'auto',

                '& .new-toolbox': {
                    width: 'auto'
                }
            },

            '& #preview': {
                backgroundColor: 'transparent',
                bottom: '0',
                left: '0',
                position: 'absolute',
                right: '0',
                top: '0',

                '& .avatar': {
                    display: 'none'
                }
            },

            '&.splash': {
                '& .content': {
                    marginLeft: `calc((100% - var(--prejoin-default-content-width) + ${sidePanelWidth}) / 2)`
                }
            },

            '&.guest': {
                '& .content': {
                    marginBottom: 'auto'
                }
            }
        }
    };
};

/**
 * This component is displayed before joining a meeting.
 */
class PrejoinThirdParty extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            classes,
            className,
            deviceStatusVisible,
            showCameraPreview,
            videoTrack
        } = this.props;

        return (
            <PreMeetingScreen
                className = { clsx('prejoin-third-party', className, classes.root) }
                showDeviceStatus = { deviceStatusVisible }
                skipPrejoinButton = { false }
                thirdParty = { true }
                videoMuted = { !showCameraPreview }
                videoTrack = { videoTrack } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        showCameraPreview: !isVideoMutedByUser(state),
        videoTrack: getLocalJitsiVideoTrack(state)
    };
}

export default connect(mapStateToProps)(translate(withStyles(styles)(PrejoinThirdParty)));
