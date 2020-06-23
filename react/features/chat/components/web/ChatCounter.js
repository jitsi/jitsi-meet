// @flow

import React, { Component } from 'react';

import { connect } from '../../../base/redux';
import { getUnreadCount } from '../../functions';

/**
 * The type of the React {@code Component} props of {@link ChatCounter}.
 */
type Props = {

    /**
     * The value of to display as a count.
     */
    _count: number
};

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
    return {
        _count: getUnreadCount(state)
    };
}

export default connect(_mapStateToProps)(ChatCounter);
