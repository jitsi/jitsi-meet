// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { hideDialog, BottomSheet } from '../../../base/dialog';
import { AudioRouteButton } from '../../../mobile/audio-mode';
import { PictureInPictureButton } from '../../../mobile/picture-in-picture';
import { RoomLockButton } from '../../../room-lock';

import AudioOnlyButton from './AudioOnlyButton';
import ToggleCameraButton from './ToggleCameraButton';

import { overflowMenuItemStyles } from './styles';

type Props = {

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function,
};

/**
 * The exported React {@code Component}. We need a reference to the wrapped
 * component in order to be able to hide it using the dialog hiding logic.
 */

// eslint-disable-next-line prefer-const
let OverflowMenu_;

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

        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <BottomSheet onCancel = { this._onCancel }>
                <AudioRouteButton
                    showLabel = { true }
                    styles = { overflowMenuItemStyles } />
                <ToggleCameraButton
                    showLabel = { true }
                    styles = { overflowMenuItemStyles } />
                <AudioOnlyButton
                    showLabel = { true }
                    styles = { overflowMenuItemStyles } />
                <RoomLockButton
                    showLabel = { true }
                    styles = { overflowMenuItemStyles } />
                <PictureInPictureButton
                    showLabel = { true }
                    styles = { overflowMenuItemStyles } />
            </BottomSheet>
        );
    }

    _onCancel: () => void;

    /**
     * Hides the dialog.
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
