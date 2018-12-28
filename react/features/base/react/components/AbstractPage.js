// @flow

import { Component } from 'react';

/**
 * Abstract component that defines a refreshable page to be rendered by
 * {@code PagedList}.
 */
export default class AbstractPage<P> extends Component<P> {
    /**
     * Method to be overriden by the implementing classes to refresh the data
     * content of the component.
     *
     * Note: It is a static method as the {@code Component} may not be
     * initialized yet when the UI invokes refresh (e.g. Tab change).
     *
     * @returns {void}
     */
    static refresh() {
        // No implementation in abstract class.
    }
}
