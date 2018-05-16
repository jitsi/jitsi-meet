// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { hideDialog, BottomSheet } from '../../../base/dialog';
import { RoomLockButton } from '../../../room-lock';
import {
    overflowMenuItemStyles
} from '../../../toolbox/components/native/styles';

import ShareMeetingInfoButton from './ShareMeetingInfoButton';

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
let ShareMeetingMenu_;

/**
 * Implements a React {@code Component} with some extra actions in addition to
 * those in the toolbar.
 */
class ShareMeetingMenu extends Component<Props> {
    /**
     * Initializes a new {@code ShareMeetingMenu} instance.
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
        const buttonProps = {
            showLabel: true,
            styles: overflowMenuItemStyles
        };

        /* eslint-disable react/jsx-handler-names */

        return (
            <BottomSheet
                onCancel = { this._onCancel }
                title = 'Share'>
                <ShareMeetingInfoButton
                    afterShare = { this._onCancel }
                    { ...buttonProps } />
                <RoomLockButton
                    afterClick = { this._onCancel }
                    { ...buttonProps } />
            </BottomSheet>
        );

        /* eslint-enable react/jsx-handler-names */
    }

    _onCancel: () => void;

    /**
     * Hides the dialog.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this.props.dispatch(hideDialog(ShareMeetingMenu_));
    }
}

ShareMeetingMenu_ = connect()(ShareMeetingMenu);

export default ShareMeetingMenu_;
