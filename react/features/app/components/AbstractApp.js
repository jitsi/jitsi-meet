import React, { Component } from 'react';

import {
    localParticipantJoined,
    localParticipantLeft
} from '../../base/participants';

import {
    appNavigate,
    appWillMount,
    appWillUnmount
} from '../actions';

/**
 * Base (abstract) class for main App component.
 *
 * @abstract
 */
export class AbstractApp extends Component {
    /**
     * AbstractApp component's property types.
     *
     * @static
     */
    static propTypes = {
        config: React.PropTypes.object,
        store: React.PropTypes.object,

        /**
         * The URL, if any, with which the app was launched.
         */
        url: React.PropTypes.string
    }

    /**
     * Init lib-jitsi-meet and create local participant when component is going
     * to be mounted.
     *
     * @inheritdoc
     */
    componentWillMount() {
        const dispatch = this.props.store.dispatch;

        dispatch(appWillMount(this));

        dispatch(localParticipantJoined());

        this._openURL(this._getDefaultURL());
    }

    /**
     * Dispose lib-jitsi-meet and remove local participant when component is
     * going to be unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        const dispatch = this.props.store.dispatch;

        dispatch(localParticipantLeft());

        dispatch(appWillUnmount(this));
    }

    /**
     * Create a ReactElement from the specified component, the specified props
     * and the props of this AbstractApp which are suitable for propagation to
     * the children of this Component.
     *
     * @param {Component} component - The component from which the ReactElement
     * is to be created.
     * @param {Object} props - The read-only React Component props with which
     * the ReactElement is to be initialized.
     * @returns {ReactElement}
     * @protected
     */
    _createElement(component, props) {
        /* eslint-disable no-unused-vars, lines-around-comment */
        const {
            // Don't propagate the config prop(erty) because the config is
            // stored inside the Redux state and, thus, is visible to the
            // children anyway.
            config,
            // Don't propagate the dispatch and store props because they usually
            // come from react-redux and programmers don't really expect them to
            // be inherited but rather explicitly connected.
            dispatch, // eslint-disable-line react/prop-types
            store,
            // The url property was introduced to be consumed entirely by
            // AbstractApp.
            url,
            // The remaining props, if any, are considered suitable for
            // propagation to the children of this Component.
            ...thisProps
        } = this.props;
        /* eslint-enable no-unused-vars, lines-around-comment */

        // eslint-disable-next-line object-property-newline
        return React.createElement(component, { ...thisProps, ...props });
    }

    /**
     * Gets the default URL to be opened when this App mounts.
     *
     * @private
     * @returns {string} The default URL to be opened when this App mounts.
     */
    _getDefaultURL() {
        // If the URL was explicitly specified to the React Component, then open
        // it.
        let url = this.props.url;

        if (url) {
            return url;
        }

        // If the execution environment provides a Location abstraction, then
        // this App at already at that location but it must be made aware of the
        // fact.
        const windowLocation = this._getWindowLocation();

        if (windowLocation) {
            url = windowLocation.toString();
            if (url) {
                return url;
            }
        }

        // By default, open the domain configured in the configuration file
        // which may be the domain at which the whole server infrastructure is
        // deployed.
        const config = this.props.config;

        if (typeof config === 'object') {
            const hosts = config.hosts;

            if (typeof hosts === 'object') {
                const domain = hosts.domain;

                if (domain) {
                    return `https://${domain}`;
                }
            }
        }

        return 'https://meet.jit.si';
    }

    /**
     * Gets a Location object from the window with information about the current
     * location of the document. Explicitly defined to allow extenders to
     * override because React Native does not usually have a location property
     * on its window unless debugging remotely in which case the browser that is
     * the remote debugger will provide a location property on the window.
     *
     * @protected
     * @returns {Location} A Location object with information about the current
     * location of the document.
     */
    _getWindowLocation() {
        return undefined;
    }

    /**
     * Navigates this AbstractApp to (i.e. opens) a specific URL.
     *
     * @param {string} url - The URL to which to navigate this AbstractApp (i.e.
     * the URL to open).
     * @protected
     * @returns {void}
     */
    _openURL(url) {
        this.props.store.dispatch(appNavigate(url));
    }
}
