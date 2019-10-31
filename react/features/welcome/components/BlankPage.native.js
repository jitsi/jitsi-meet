// @flow

import React, { Component } from 'react';
import { View } from 'react-native';
import type { Dispatch } from 'redux';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import { LoadingIndicator } from '../../base/react';
import { connect } from '../../base/redux';
import { StyleType } from '../../base/styles';
import { destroyLocalTracks } from '../../base/tracks';

import styles from './styles';

/**
 * The type of React {@code Component} props of {@link BlankPage}.
 */
type Props = {

    /**
     * The color schemed style of the component.
     */
    _styles: StyleType,

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
        const { _styles } = this.props;

        return (
            <View
                style = { [
                    styles.blankPageWrapper,
                    _styles.loadingOverlayWrapper
                ] }>
                <LoadingIndicator
                    color = { _styles.indicatorColor }
                    size = 'large' />
            </View>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'LoadConfigOverlay')
    };
}

export default connect(_mapStateToProps)(BlankPage);
