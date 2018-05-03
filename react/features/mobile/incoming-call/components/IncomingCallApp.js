import { App } from '../../../app';
import { RouteRegistry } from '../../../base/react';
import { incomingCallReceived } from '../actions';

import IncomingCallPage from './IncomingCallPage';

/**
 * Root application component for incoming call.
 *
 * @extends App
 */
export default class IncomingCallApp extends App {

    /**
     * Creates incoming call when component is going to be mounted.
     *
     * @inheritdoc
     */
    componentWillMount() {
        super.componentWillMount();
        this._init.then(() => {
            const { dispatch } = this._getStore();

            dispatch(incomingCallReceived({
                name: this.props.callerName,
                avatarUrl: this.props.callerAvatarUrl
            }));
        });
    }

    /**
     * Navigates to {@code IncomingCallPage}.
     *
     * @param {Object|string} url - Ingored.
     * @protected
     * @returns {void}
     */
    _openURL(url) { // eslint-disable-line no-unused-vars
        this._navigate(RouteRegistry.getRouteByComponent(IncomingCallPage));
    }
}
