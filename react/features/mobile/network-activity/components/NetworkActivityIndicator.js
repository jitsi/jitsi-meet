// @flow

import React, { Component } from 'react';

import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';

/**
 * The type of the React {@code Component} props of
 * {@link NetworkActivityIndicator}.
 */
type Props = {

    /**
     * Indicates whether there is network activity i.e. ongoing network
     * requests.
     */
    _networkActivity: boolean
};

/**
 * The React {@code Component} which renders a progress indicator when there
 * are ongoing network requests.
 */
class NetworkActivityIndicator extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this.props._networkActivity ? <LoadingIndicator /> : null;
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code NetworkActivityIndicator}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _networkActivity: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { requests } = state['features/network-activity'];

    return {
        _networkActivity: Boolean(requests && requests.size)
    };
}

export default connect(_mapStateToProps)(NetworkActivityIndicator);
