// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { beginShareRoom } from '../../share-room';
import { ToolbarButton } from '../../toolbox';

import { beginAddPeople } from '../actions';
import { isAddPeopleEnabled, isDialOutEnabled } from '../functions';

/**
 * The indicator which determines (at bundle time) whether there should be a
 * {@code ToolbarButton} in {@code Toolbox} to expose the functionality of the
 * feature share-room in the user interface of the app.
 *
 * @private
 * @type {boolean}
 */
const _SHARE_ROOM_TOOLBAR_BUTTON = true;

/**
 * The type of {@link EnterPictureInPictureToobarButton}'s React
 * {@code Component} props.
 */
type Props = {

    /**
     * Whether or not the feature to directly invite people into the
     * conference is available.
     */
    _addPeopleEnabled: boolean,

    /**
     * Whether or not the feature to dial out to number to join the
     * conference is available.
     */
    _dialOutEnabled: boolean,

    /**
     * Launches native invite dialog.
     *
     * @protected
     */
    _onAddPeople: Function,

    /**
     * Begins the UI procedure to share the conference/room URL.
     */
    _onShareRoom: Function
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
            _addPeopleEnabled,
            _dialOutEnabled,
            _onAddPeople,
            _onShareRoom,
            ...props
        } = this.props;

        if (_addPeopleEnabled || _dialOutEnabled) {
            return (
                <ToolbarButton
                    iconName = { 'link' }
                    onClick = { _onAddPeople }
                    { ...props } />
            );
        }

        if (_SHARE_ROOM_TOOLBAR_BUTTON) {
            return (
                <ToolbarButton
                    iconName = 'link'
                    onClick = { _onShareRoom }
                    { ...props } />
            );
        }

        return null;
    }
}

/**
 * Maps redux actions to {@link InviteButton}'s React
 * {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _onAddPeople,
 *     _onShareRoom
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
        _onAddPeople() {
            dispatch(beginAddPeople());
        },

        /**
         * Begins the UI procedure to share the conference/room URL.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onShareRoom() {
            dispatch(beginShareRoom());
        }
    };
}

/**
 * Maps (parts of) the redux state to {@link Toolbox}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state) {
    return {
        /**
         * Whether or not the feature to directly invite people into the
         * conference is available.
         *
         * @type {boolean}
         */
        _addPeopleEnabled: isAddPeopleEnabled(state),

        /**
         * Whether or not the feature to dial out to number to join the
         * conference is available.
         *
         * @type {boolean}
         */
        _dialOutEnabled: isDialOutEnabled(state)
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(InviteButton);
