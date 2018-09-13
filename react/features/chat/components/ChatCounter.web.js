// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getUnreadCount } from '../functions';
import { markAllRead } from './../actions';


type Props = {

    _panelStatus: Boolean,

    dispatch: Function,

    _count: number,

}

/**
 * Implements a React {@link Component} which displays a count of the number of
 * unread chat messages.
 *
 * @extends Component
 */
class ChatCounter extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.props._panelStatus && this.props._count > 0) {
            this.props.dispatch(markAllRead());
        }

        return (
            <span className = 'badge-round'>
                <span>
                    { this.props._count || null }
                </span>
            </span>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code ChatCounter}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _count: number
 * }}
 */
function _mapStateToProps(state) {

    const {
        panelStatus
    } = state['features/side-panel'];

    return {
        _count: getUnreadCount(state),
        _panelStatus: panelStatus
    };
}

export default connect(_mapStateToProps)(ChatCounter);
