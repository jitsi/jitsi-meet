// @flow

import { Component } from 'react';

/**
 * {@code Fragment} component's property types.
 *
 * @static
 */
type Props = {
    children: React$Node
};

/**
 * react-redux's {@code Provider} component only accepts a single child, so use
 * a simple wrapper component in order to pass more than 1 child components.
 *
 * TODO Remove once React Native supports Fragment (0.52 probably).
 */
export default class Fragment extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        return this.props.children;
    }
}
