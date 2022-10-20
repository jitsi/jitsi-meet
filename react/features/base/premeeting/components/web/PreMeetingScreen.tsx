/* eslint-disable lines-around-comment */
import { Theme } from '@mui/material';
import React, { ReactNode } from 'react';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import DeviceStatus from '../../../../prejoin/components/preview/DeviceStatus';
// @ts-ignore
import { Toolbox } from '../../../../toolbox/components/web';
import { getConferenceName } from '../../../conference/functions';
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from '../../../config/constants';
import { getToolbarButtons, isToolbarButtonEnabled } from '../../../config/functions.web';
import { connect } from '../../../redux/functions';
import { withPixelLineHeight } from '../../../styles/functions.web';

import ConnectionStatus from './ConnectionStatus';
// @ts-ignore
import Preview from './Preview';

interface IProps {

    /**
     * The list of toolbar buttons to render.
     */
    _buttons: Array<string>;

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
    showCopyUrlButton: boolean;

    /**
     * Indicates whether the device status should be shown.
     */
    showDeviceStatus: boolean;

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

const useStyles = makeStyles()((theme: Theme) => {
    return {
        subtitle: {
            ...withPixelLineHeight(theme.typography.heading5),
            color: theme.palette.text01,
            marginBottom: theme.spacing(4),
            overflow: 'hidden',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
        }
    };
});

const PreMeetingScreen = ({
    _buttons,
    _premeetingBackground,
    _roomName,
    children,
    className,
    showDeviceStatus,
    skipPrejoinButton,
    title,
    videoMuted,
    videoTrack
}: IProps) => {
    const { classes } = useStyles();
    const containerClassName = `premeeting-screen ${className ? className : ''}`;
    const style = _premeetingBackground ? {
        background: _premeetingBackground,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
    } : {};

    return (
        <div className = { containerClassName }>
            <div style = { style }>
                <div className = 'content'>
                    <ConnectionStatus />

                    <div className = 'content-controls'>
                        <h1 className = 'title'>
                            {title}
                        </h1>
                        {_roomName && (
                            <span className = { classes.subtitle }>
                                {_roomName}
                            </span>
                        )}
                        {children}
                        {_buttons.length && <Toolbox toolbarButtons = { _buttons } />}
                        {skipPrejoinButton}
                        {showDeviceStatus && <DeviceStatus />}
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
    const { hiddenPremeetingButtons, hideConferenceSubject } = state['features/base/config'];
    const toolbarButtons = getToolbarButtons(state);
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
            : premeetingButtons.filter(b => isToolbarButtonEnabled(b, toolbarButtons)),
        _premeetingBackground: premeetingBackground,
        _roomName: hideConferenceSubject ? undefined : getConferenceName(state)
    };
}

export default connect(mapStateToProps)(PreMeetingScreen);
