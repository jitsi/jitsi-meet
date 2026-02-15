import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconEnlarge } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { closeOverflowMenuIfOpen } from '../../actions.web';

const LARGE_VIDEO_ID = 'largeVideo';

interface IProps extends AbstractButtonProps {
    _isInPictureInPicture?: boolean;
    _isPiPSupported?: boolean;
}

/**
 * Returns true if the Picture-in-Picture API is supported and the large video
 * element exists and has a video stream.
 */
function isPiPAvailable(): boolean {
    if (!document.pictureInPictureEnabled) {
        return false;
    }
    const video = document.getElementById(LARGE_VIDEO_ID) as HTMLVideoElement | null;
    return Boolean(video?.srcObject || (video as HTMLVideoElement & { videoWidth?: number })?.videoWidth);
}

/**
 * Toggle Picture-in-Picture for the large video. Stays visible when user
 * switches browser tabs (like the system "sharing your screen" bar).
 */
class PictureInPictureButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.pip';
    override label = 'toolbar.pip';
    override icon = IconEnlarge;

    override _getTooltip() {
        return 'toolbar.pip';
    }

    override _isToggled() {
        return Boolean(this.props._isInPictureInPicture);
    }

    override _isDisabled() {
        return !this.props._isPiPSupported;
    }

    override _handleClick() {
        const { dispatch } = this.props;
        const video = document.getElementById(LARGE_VIDEO_ID) as HTMLVideoElement | null;

        dispatch(closeOverflowMenuIfOpen());

        if (!video) {
            return;
        }

        if (document.pictureInPictureElement) {
            sendAnalytics(createToolbarEvent('pip.toggle', { enable: false }));
            document.exitPictureInPicture().catch(() => {});
        } else {
            sendAnalytics(createToolbarEvent('pip.toggle', { enable: true }));
            video.requestPictureInPicture().catch(() => {});
        }
    }
}

/**
 * Wrapper that injects PiP support and document.pictureInPictureElement state
 * into the button, since that state is not in Redux.
 */
function PictureInPictureButtonWithState(props: IProps) {
    const [ isInPictureInPicture, setIsInPictureInPicture ] = useState(Boolean(document.pictureInPictureElement));
    const [ isPiPSupported, setIsPiPSupported ] = useState(isPiPAvailable());

    useEffect(() => {
        if (!document.pictureInPictureEnabled) {
            return;
        }

        const video = document.getElementById(LARGE_VIDEO_ID);

        const onEnter = () => setIsInPictureInPicture(true);
        const onLeave = () => setIsInPictureInPicture(false);

        video?.addEventListener('enterpictureinpicture', onEnter);
        video?.addEventListener('leavepictureinpicture', onLeave);

        return () => {
            video?.removeEventListener('enterpictureinpicture', onEnter);
            video?.removeEventListener('leavepictureinpicture', onLeave);
        };
    }, []);

    // Re-check support when large video might have appeared (e.g. after join)
    useEffect(() => {
        const t = setInterval(() => {
            setIsPiPSupported(isPiPAvailable());
        }, 2000);
        return () => clearInterval(t);
    }, []);

    return (
        <PictureInPictureButton
            { ...props }
            _isInPictureInPicture = { isInPictureInPicture }
            _isPiPSupported = { isPiPSupported } />
    );
}

const mapStateToProps = (state: IReduxState) => ({
    visible: document.pictureInPictureEnabled
});

export default translate(connect(mapStateToProps)(PictureInPictureButtonWithState));
