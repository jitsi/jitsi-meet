// @flow

import React, { PureComponent } from 'react';

import DeviceStatus from '../../../../prejoin/components/preview/DeviceStatus';
import { Toolbox } from '../../../../toolbox/components/web';

import ConnectionStatus from './ConnectionStatus';
import Preview from './Preview';

type Props = {

    /**
     * Children component(s) to be rendered on the screen.
     */
    children?: React$Node,

    /**
     * Additional CSS class names to set on the icon container.
     */
    className?: string,

    /**
     * The name of the participant.
     */
    name?: string,

    /**
     * Indicates whether the copy url button should be shown
     */
    showCopyUrlButton: boolean,

    /**
     * Indicates whether the device status should be shown
     */
    showDeviceStatus: boolean,

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
     skipPrejoinButton?: React$Node,

    /**
     * Title of the screen.
     */
    title?: string,

    /**
     * Override for default toolbar buttons
     */
     toolbarButtons?: Array<string>,

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean,

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object
}

const buttons = [ 'microphone', 'camera', 'select-background', 'invite', 'settings' ];

/**
 * Implements a pre-meeting screen that can be used at various pre-meeting phases, for example
 * on the prejoin screen (pre-connection) or lobby (post-connection).
 */
export default class PreMeetingScreen extends PureComponent<Props> {
    /**
     * Default values for {@code Prejoin} component's properties.
     *
     * @static
     */
    static defaultProps = {
        showCopyUrlButton: true,
        showToolbox: true
    };

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            children,
            className,
            showDeviceStatus,
            skipPrejoinButton,
            title,
            toolbarButtons,
            videoMuted,
            videoTrack
        } = this.props;

        const containerClassName = `premeeting-screen ${className ? className : ''}`;

        return (
            <div className = { containerClassName }>
                <div className = 'content'>
                    <ConnectionStatus />

                    <div className = 'content-controls'>
                        <h1 className = 'title'>
                            { title }
                        </h1>
                        { children }
                        <Toolbox toolbarButtons = { toolbarButtons || buttons } />
                        { skipPrejoinButton }
                        { showDeviceStatus && <DeviceStatus /> }
                    </div>
                </div>

                <Preview
                    videoMuted = { videoMuted }
                    videoTrack = { videoTrack } />
            </div>
        );
    }
}
