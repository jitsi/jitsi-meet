// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getAppProp } from '../../../app';
import { ToolbarButton } from '../../../toolbox';

import { enterPictureInPicture } from '../actions';

/**
 * The type of {@link EnterPictureInPictureToobarButton}'s React
 * {@code Component} props.
 */
type Props = {

    /**
     * Enters (or rather initiates entering) picture-in-picture.
     *
     * @protected
     */
    _onEnterPictureInPicture: Function,

    /**
     * The indicator which determines whether Picture-in-Picture is enabled.
     *
     * @protected
     */
    _pictureInPictureEnabled: boolean
};

/**
 * Implements a {@link ToolbarButton} to enter Picture-in-Picture.
 */
class EnterPictureInPictureToolbarButton extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _onEnterPictureInPicture,
            _pictureInPictureEnabled,
            ...props
        } = this.props;

        if (!_pictureInPictureEnabled) {
            return null;
        }

        return (
            <ToolbarButton
                iconName = { 'menu-down' }
                onClick = { _onEnterPictureInPicture }
                { ...props } />
        );
    }
}

/**
 * Maps redux actions to {@link EnterPictureInPictureToolbarButton}'s React
 * {@code Component} props.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 * }}
 * @private
 */
function _mapDispatchToProps(dispatch) {
    return {

        /**
         * Requests Picture-in-Picture mode.
         *
         * @private
         * @returns {void}
         * @type {Function}
         */
        _onEnterPictureInPicture() {
            dispatch(enterPictureInPicture());
        }
    };
}

/**
 * Maps (parts of) the redux state to
 * {@link EnterPictureInPictureToolbarButton}'s React {@code Component} props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 * }}
 */
function _mapStateToProps(state) {
    return {

        /**
         * The indicator which determines whether Picture-in-Picture is enabled.
         *
         * @protected
         * @type {boolean}
         */
        _pictureInPictureEnabled:
            Boolean(getAppProp(state, 'pictureInPictureEnabled'))
    };
}

export default connect(_mapStateToProps, _mapDispatchToProps)(
    EnterPictureInPictureToolbarButton);
