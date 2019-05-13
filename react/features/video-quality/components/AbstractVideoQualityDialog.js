// @flow

import { Component } from 'react';

import { toggleVideoQualityDialog } from '../actions';

/**
 * The type of the React {@code Component} props of {@code AbstractVideoQualityDialog}.
 */
export type Props = {

    /**
     * True if the video quality dialog should be rendered.
     */
    _isOpen: boolean,

    /**
     * Function to toggle the video quality dialog.
     */
    _onToggleVideoQualityDialog: Function,
	
    /**
     * The Redux dispatch function.
     */
    dispatch: Dispatch<*>,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements an abstract video quality dialog.
 */
export default class AbstractVideoQualityDialog<P: Props> extends Component<P> {}

/**
 * Maps redux actions to the props of the component.
 *
 * @param {Function} dispatch - The redux action {@code dispatch} function.
 * @returns {{
 *     _onToggleVideoQualityDialog: Function
 * }}
 * @private
 */
export function _mapDispatchToProps(dispatch: Dispatch<*>) {
    return {
        /**
         * Toggles the video quality dialog.
         *
         * @returns {Function}
         */
        _onToggleVideoQualityDialog() {
            dispatch(toggleVideoQualityDialog());
        }
    };
}

/**
 * Maps (parts of) the redux state to {@link VideoQualityDialog} React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{
 *     _isOpen: boolean,
 * }}
 */
export function _mapStateToProps(state: Object) {
    const { isOpen } = state['features/video-quality'];

    return {
        _isOpen: isOpen,
    };
}
