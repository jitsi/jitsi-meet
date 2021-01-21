// @flow

import React from 'react';

import { Icon, IconMenuThumb } from '../../../base/icons';
import { Popover } from '../../../base/popover';
import { connect } from '../../../base/redux';
import { getLocalVideoTrack } from '../../../base/tracks';
import { getCurrentLayout, LAYOUTS } from '../../../video-layout';

import FlipLocalVideoButton from './FlipLocalVideoButton';
import VideoMenu from './VideoMenu';

/**
 * The type of the React {@code Component} props of
 * {@link LocalVideoMenuTriggerButton}.
 */
type Props = {

    /**
     * The position relative to the trigger the local video menu should display
     * from. Valid values are those supported by AtlasKit
     * {@code InlineDialog}.
     */
    _menuPosition: string,

    /**
     * Whether to display the Popover as a drawer.
     */
    _overflowDrawer: boolean,

    /**
     * Shows/hides the local video flip button.
     */
    _showLocalVideoFlipButton: boolean
};

/**
 * React Component for displaying an icon associated with opening the
 * the video menu for the local participant.
 *
 * @param {Props} props - The props passed to the component.
 * @returns {ReactElement}
 */
function LocalVideoMenuTriggerButton(props: Props) {
    return (
        props._showLocalVideoFlipButton
            ? <Popover
                content = {
                    <VideoMenu id = 'localVideoMenu'>
                        <FlipLocalVideoButton />
                    </VideoMenu>
                }
                overflowDrawer = { props._overflowDrawer }
                position = { props._menuPosition }>
                <span
                    className = 'popover-trigger local-video-menu-trigger'>
                    <Icon
                        size = '1em'
                        src = { IconMenuThumb }
                        title = 'Local user controls' />
                </span>
            </Popover>
            : null
    );
}

/**
 * Maps (parts of) the Redux state to the associated {@code LocalVideoMenuTriggerButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const currentLayout = getCurrentLayout(state);
    const { disableLocalVideoFlip } = state['features/base/config'];
    const videoTrack = getLocalVideoTrack(state['features/base/tracks']);
    const { overflowDrawer } = state['features/toolbox'];
    let _menuPosition;

    switch (currentLayout) {
    case LAYOUTS.TILE_VIEW:
        _menuPosition = 'left-start';
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        _menuPosition = 'left-end';
        break;
    default:
        _menuPosition = 'auto';
    }

    return {
        _menuPosition,
        _showLocalVideoFlipButton: !disableLocalVideoFlip && videoTrack?.videoType !== 'desktop',
        _overflowDrawer: overflowDrawer
    };
}

export default connect(_mapStateToProps)(LocalVideoMenuTriggerButton);
