// @flow

import React, { Component } from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';

import {
    BottomSheet,
    bottomSheetItemStylesCombined,
    hideDialog
} from '../../../base/dialog';
import { InviteButton } from '../../../invite';
import { AudioRouteButton } from '../../../mobile/audio-mode';
import { LiveStreamButton, RecordButton } from '../../../recording';
import { RoomLockButton } from '../../../room-lock';
import { ClosedCaptionButton } from '../../../subtitles';
import { TileViewButton } from '../../../video-layout';

import AudioOnlyButton from './AudioOnlyButton';
import ToggleCameraButton from './ToggleCameraButton';

declare var __DEV__;

/**
 * The type of the React {@code Component} props of {@link OverflowMenu}.
 */
type Props = {

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function,
};

/**
 * The exported React {@code Component}. We need it to execute
 * {@link hideDialog}.
 *
 * XXX It does not break our coding style rule to not utilize globals for state,
 * because it is merely another name for {@code export}'s {@code default}.
 */
let OverflowMenu_; // eslint-disable-line prefer-const

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class OverflowMenu extends Component<Props> {
    /**
     * Initializes a new {@code OverflowMenu} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const buttonProps = {
            afterClick: this._onCancel,
            showLabel: true,
            styles: bottomSheetItemStylesCombined
        };

        return (
            <BottomSheet onCancel = { this._onCancel }>
                <AudioRouteButton { ...buttonProps } />
                <ToggleCameraButton { ...buttonProps } />
                <AudioOnlyButton { ...buttonProps } />
                <RoomLockButton { ...buttonProps } />
                <ClosedCaptionButton { ...buttonProps } />
                {

                    // Apple rejected our app because they claim requiring a
                    // Dropbox account for recording is not acceptable.
                    // Ddisable it until we can find a way around it.
                    (__DEV__ || Platform.OS !== 'ios')
                        && <RecordButton { ...buttonProps } />
                }
                <LiveStreamButton { ...buttonProps } />
                <TileViewButton { ...buttonProps } />
                <InviteButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    _onCancel: () => void;

    /**
     * Hides this {@code OverflowMenu}.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(hideDialog(OverflowMenu_));
    }
}

OverflowMenu_ = connect()(OverflowMenu);

export default OverflowMenu_;
