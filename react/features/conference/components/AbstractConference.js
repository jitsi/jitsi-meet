// @flow

import { shouldDisplayTileView } from '../../video-layout';

/**
 * The type of the React {@code Component} props of {@link AbstractLabels}.
 */
export type AbstractProps = {

    /**
     * Conference room name.
     *
     * @protected
     * @type {string}
     */
    _room: string,

    /**
     * Whether or not the layout should change to support tile view mode.
     *
     * @protected
     * @type {boolean}
     */
    _shouldDisplayTileView: boolean
};

/**
 * Maps (parts of) the redux state to the associated props of the {@link Labels}
 * {@code Component}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {AbstractProps}
 */
export function abstractMapStateToProps(state: Object) {
    return {
        _room: state['features/base/conference'].room,
        _shouldDisplayTileView: shouldDisplayTileView(state)
    };
}
