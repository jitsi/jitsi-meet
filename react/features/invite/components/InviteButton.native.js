// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { launchNativeInvite } from '../../mobile/invite-search';
import { ToolbarButton } from '../../toolbox';

/**
 * The type of {@link EnterPictureInPictureToobarButton}'s React
 * {@code Component} props.
 */
type Props = {

    /**
     * Indicates if the "Add to call" feature is available.
     */
    enableAddPeople: boolean,

    /**
     * Indicates if the "Dial out" feature is available.
     */
    enableDialOut: boolean,

    /**
     * Launches native invite dialog.
     *
     * @protected
     */
    onLaunchNativeInvite: Function,
};

/**
 * Implements a {@link ToolbarButton} to enter Picture-in-Picture.
 */
class InviteButton extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            enableAddPeople,
            enableDialOut,
            onLaunchNativeInvite,
            ...props
        } = this.props;

        if (!enableAddPeople && !enableDialOut) {
            return null;
        }

        return (
            <ToolbarButton
                iconName = { 'add' }
                onClick = { onLaunchNativeInvite }
                { ...props } />
        );
    }
}

/**
 * Maps redux actions to {@link InviteButton}'s React
 * {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
*      onLaunchNativeInvite
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch) {
    return {

        /**
         * Launches native invite dialog.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        onLaunchNativeInvite() {
            dispatch(launchNativeInvite());
        }
    };
}

export default connect(undefined, _mapDispatchToProps)(InviteButton);
