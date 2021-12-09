// @flow

import React, { Component } from 'react';

import { connect } from '../../../base/redux';

import CalleeInfo from './CalleeInfo';

/**
 * The type of the React {@code Component} props of {@code CalleeInfoContainer}.
 */
type Props = {

    /**
     * The indicator which determines whether {@code CalleeInfo} is to be
     * rendered.
     *
     * @private
     */
    _calleeInfoVisible: boolean
};

/**
 * Implements a React {@link Component} which depicts the establishment of a
 * call with a specific remote callee if there is such a remote callee.
 *
 * @augments Component
 */
class CalleeInfoContainer extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this.props._calleeInfoVisible ? <CalleeInfo /> : null;
    }
}

/**
 * Maps parts of the redux state to {@link CalleeInfoContainer} (React
 * {@code Component}) props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code CalleeInfoContainer} props.
 * @private
 * @returns {{
 *     _calleeInfoVisible: boolean
 * }}
 */
function _mapStateToProps(state: Object): Object {
    return {
        /**
         * The indicator which determines whether {@code CalleeInfo} is to be
         * rendered.
         *
         * @private
         * @type {boolean}
         */
        _calleeInfoVisible: state['features/invite'].calleeInfoVisible
    };
}

export default connect(_mapStateToProps)(CalleeInfoContainer);
