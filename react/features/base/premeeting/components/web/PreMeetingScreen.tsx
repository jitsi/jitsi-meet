import clsx from 'clsx';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import DeviceStatus from '../../../../prejoin/components/web/preview/DeviceStatus';
import { isRoomNameEnabled } from '../../../../prejoin/functions.web';
import Toolbox from '../../../../toolbox/components/web/Toolbox';
import { isButtonEnabled } from '../../../../toolbox/functions.web';
import { getConferenceName } from '../../../conference/functions';
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from '../../../config/constants';
import { withPixelLineHeight } from '../../../styles/functions.web';
import Tooltip from '../../../tooltip/components/Tooltip';
import { isPreCallTestEnabled } from '../../functions';

import ConnectionStatus from './ConnectionStatus';
import Preview from './Preview';
import RecordingWarning from './RecordingWarning';
import UnsafeRoomWarning from './UnsafeRoomWarning';

interface IProps {

    /**
     * The list of toolbar buttons to render.
     */
    _buttons: Array<string>;

    /**
     * Determine if pre call test is enabled.
     */
    _isPreCallTestEnabled?: boolean;

    /**
     * The branding background of the premeeting screen(lobby/prejoin).
     */
    _premeetingBackground: string;

    /**
     * The name of the meeting that is about to be joined.
     */
    _roomName: string;

    /**
     * Children component(s) to be rendered on the screen.
     */
    children?: ReactNode;

    /**
     * Additional CSS class names to set on the icon container.
     */
    className?: string;

    /**
     * The name of the participant.
     */
    name?: string;

    /**
     * Indicates whether the copy url button should be shown.
     */
    showCopyUrlButton?: boolean;

    /**
     * Indicates whether the device status should be shown.
     */
    showDeviceStatus: boolean;

    /**
     * Indicates whether to display the recording warning.
     */
    showRecordingWarning?: boolean;

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning?: boolean;

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
    skipPrejoinButton?: ReactNode;

    /**
     * Whether it's used in the 3rdParty prejoin screen or not.
     */
    thirdParty?: boolean;

    /**
     * Title of the screen.
     */
    title?: string;

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean;

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            height: '100%',
            position: 'absolute',
            inset: '0 0 0 0',
            display: 'flex',
            backgroundColor: theme.palette.ui01,
            zIndex: 252,

            '@media (max-width: 720px)': {
                flexDirection: 'column-reverse'
            }
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
            margin: '0 48px',
            padding: '24px 0 16px',
            position: 'relative',
            width: '300px',
            height: '100%',
            zIndex: 252,

            '@media (max-width: 720px)': {
                height: 'auto',
                margin: '0 auto'
            },

            // mobile phone landscape
            '@media (max-width: 420px)': {
                padding: '16px 16px 0 16px',
                width: '100%'
            },

            '@media (max-width: 400px)': {
                padding: '16px'
            }
        },
        contentControls: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: 'auto',
            width: '100%'
        },
        title: {
            ...withPixelLineHeight(theme.typography.heading4),
            color: `${theme.palette.text01}!important`,
            marginBottom: theme.spacing(3),
            textAlign: 'center',

            '@media (max-width: 400px)': {
                display: 'none'
            }
        },
        roomNameContainer: {
            width: '100%',
            textAlign: 'center',
            marginBottom: theme.spacing(4)
        },

        roomName: {
            ...withPixelLineHeight(theme.typography.heading5),
            color: theme.palette.text01,
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
        }
    };
});

const PreMeetingScreen = ({
    _buttons,
    _isPreCallTestEnabled,
    _premeetingBackground,
    _roomName,
    children,
    className,
    showDeviceStatus,
    showRecordingWarning,
    showUnsafeRoomWarning,
    skipPrejoinButton,
    title,
    videoMuted,
    videoTrack
}: IProps) => {
    const { classes } = useStyles();
    const style = _premeetingBackground ? {
        background: _premeetingBackground,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
    } : {};

    const roomNameRef = useRef<HTMLSpanElement | null>(null);
    const [ isOverflowing, setIsOverflowing ] = useState(false);

    useEffect(() => {
        if (roomNameRef.current) {
            const element = roomNameRef.current;
            const elementStyles = window.getComputedStyle(element);
            const elementWidth = Math.floor(parseFloat(elementStyles.width));

            setIsOverflowing(element.scrollWidth > elementWidth + 1);
        }
    }, [ _roomName ]);

    return (
        <div className = { clsx('premeeting-screen', classes.container, className) }>
            <div style = { style }>
                <div className = { classes.content }>
                    {_isPreCallTestEnabled && <ConnectionStatus />}

                    <div className = { classes.contentControls }>
                        <h1 className = { classes.title }>
                            {title}
                        </h1>
                        {_roomName && (
                            <span className = { classes.roomNameContainer }>
                                {isOverflowing ? (
                                    <Tooltip content = { _roomName }>
                                        <span
                                            className = { classes.roomName }
                                            ref = { roomNameRef }>
                                            {_roomName}
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <span
                                        className = { classes.roomName }
                                        ref = { roomNameRef }>
                                        {_roomName}
                                    </span>
                                )}
                            </span>
                        )}
                        {children}
                        {_buttons.length && <Toolbox toolbarButtons = { _buttons } />}
                        {skipPrejoinButton}
                        {showUnsafeRoomWarning && <UnsafeRoomWarning />}
                        {showDeviceStatus && <DeviceStatus />}
                        {showRecordingWarning && <RecordingWarning />}
                    </div>
                </div>
            </div>
            <Preview
                videoMuted = { videoMuted }
                videoTrack = { videoTrack } />
        </div>
    );
};


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { hiddenPremeetingButtons } = state['features/base/config'];
    const { toolbarButtons } = state['features/toolbox'];
    const premeetingButtons = (ownProps.thirdParty
        ? THIRD_PARTY_PREJOIN_BUTTONS
        : PREMEETING_BUTTONS).filter((b: any) => !(hiddenPremeetingButtons || []).includes(b));

    const { premeetingBackground } = state['features/dynamic-branding'];

    return {
        // For keeping backwards compat.: if we pass an empty hiddenPremeetingButtons
        // array through external api, we have all prejoin buttons present on premeeting
        // screen regardless of passed values into toolbarButtons config overwrite.
        // If hiddenPremeetingButtons is missing, we hide the buttons according to
        // toolbarButtons config overwrite.
        _buttons: hiddenPremeetingButtons
            ? premeetingButtons
            : premeetingButtons.filter(b => isButtonEnabled(b, toolbarButtons)),
        _isPreCallTestEnabled: isPreCallTestEnabled(state),
        _premeetingBackground: premeetingBackground,
        _roomName: isRoomNameEnabled(state) ? getConferenceName(state) : ''
    };
}

export default connect(mapStateToProps)(PreMeetingScreen);

