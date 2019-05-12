// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { connect } from '../../base/redux';
import { destroyLocalTracks } from '../../base/tracks';
import { NetworkActivityIndicator } from '../../mobile/network-activity';

import LocalVideoTrackUnderlay from './LocalVideoTrackUnderlay';

/**
 * The type of React {@code Component} props of {@link BlankPage}.
 */
type Props = {
    dispatch: Dispatch<any>
};

/**
 * The React {@code Component} displayed by {@code AbstractApp} when it has no
 * {@code Route} to render. Renders a progress indicator when there are ongoing
 * network requests.
 */
class BlankPage extends Component<Props> {
    /**
     * Destroys the local tracks (if any) since no media is desired when this
     * component is rendered.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this.props.dispatch(destroyLocalTracks());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <LocalVideoTrackUnderlay>
                <NetworkActivityIndicator />
            </LocalVideoTrackUnderlay>
        );
    }
}

export default connect()(BlankPage);
