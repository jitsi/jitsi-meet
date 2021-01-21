// @flow

import React, { Component } from 'react';

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
     * Shows/hides the local video flip button.
     */
    _showLocalVideoFlipButton: boolean
};

/**
 * React {@code Component} for displaying an icon associated with opening the
 * the video menu for the local participant.
 *
 * @extends {Component}
 */
class LocalVideoMenuTriggerButton extends Component<Props> {
    /**
     * The internal reference to topmost DOM/HTML element backing the React
     * {@code Component}. Accessed directly for associating an element as
     * the trigger for a popover.
     *
     * @private
     * @type {HTMLDivElement}
     */
    _rootElement = null;

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const buttons = [];

        if (this.props._showLocalVideoFlipButton) {
            buttons.push(<FlipLocalVideoButton />);
        }

        if (buttons.length === 0) {
            return null;
        }

        return (
            <Popover
                content = {
                    <VideoMenu id = 'localVideoMenu'>
                        { buttons }
                    </VideoMenu>
                }
                position = { this.props._menuPosition }>
                <span
                    className = 'popover-trigger local-video-menu-trigger'>
                    <Icon
                        size = '1em'
                        src = { IconMenuThumb }
                        title = 'Local user controls' />
                </span>
            </Popover>
        );
    }
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
    let _menuPosition;

    switch (currentLayout) {
    case LAYOUTS.TILE_VIEW:
        _menuPosition = 'left top';
        break;
    case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
        _menuPosition = 'left bottom';
        break;
    default:
        _menuPosition = 'top center';
    }

    return {
        _menuPosition,
        _showLocalVideoFlipButton: !disableLocalVideoFlip && videoTrack?.videoType !== 'desktop'
    };
}

export default connect(_mapStateToProps)(LocalVideoMenuTriggerButton);
