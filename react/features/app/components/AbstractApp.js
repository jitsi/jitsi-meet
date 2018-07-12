// @flow

import React, { Fragment } from 'react';

import { BaseApp } from '../../base/app';
import { toURLString } from '../../base/util';
import { OverlayContainer } from '../../overlay';

import { appNavigate } from '../actions';
import { getDefaultURL } from '../functions';

/**
 * The type of React {@code Component} props of {@link AbstractApp}.
 */
export type Props = {

    /**
     * The default URL {@code AbstractApp} is to open when not in any
     * conference/room.
     */
    defaultURL: string,

    /**
     * XXX Refer to the implementation of loadURLObject: in
     * ios/sdk/src/JitsiMeetView.m for further information.
     */
    timestamp: any,

    /**
     * The URL, if any, with which the app was launched.
     */
    url: Object | string
};

/**
 * Base (abstract) class for main App component.
 *
 * @abstract
 */
export class AbstractApp extends BaseApp<Props, *> {
    _init: Promise<*>;

    /**
     * Initializes the app.
     *
     * @inheritdoc
     */
    componentWillMount() {
        super.componentWillMount();

        this._init.then(() => {
            // If a URL was explicitly specified to this React Component, then
            // open it; otherwise, use a default.
            this._openURL(toURLString(this.props.url) || this._getDefaultURL());
        });
    }

    /**
     * Notifies this mounted React {@code Component} that it will receive new
     * props. Makes sure that this {@code AbstractApp} has a redux store to use.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only React {@code Component} props
     * that this instance will receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps: Props) {
        const { props } = this;

        this._init.then(() => {
            // Deal with URL changes.
            let { url } = nextProps;

            url = toURLString(url);
            if (toURLString(props.url) !== url

                    // XXX Refer to the implementation of loadURLObject: in
                    // ios/sdk/src/JitsiMeetView.m for further information.
                    || props.timestamp !== nextProps.timestamp) {
                this._openURL(url || this._getDefaultURL());
            }
        });
    }

    /**
     * Gets a {@code Location} object from the window with information about the
     * current location of the document. Explicitly defined to allow extenders
     * to override because React Native does not usually have a location
     * property on its window unless debugging remotely in which case the
     * browser that is the remote debugger will provide a location property on
     * the window.
     *
     * @public
     * @returns {Location} A {@code Location} object with information about the
     * current location of the document.
     */
    getWindowLocation() {
        return undefined;
    }

    /**
     * Creates an extra {@link ReactElement}s to be added (unconditionaly)
     * alongside the main element.
     *
     * @abstract
     * @protected
     * @returns {ReactElement}
     */
    _createExtraElement() {
        return (
            <Fragment>
                <OverlayContainer />
            </Fragment>
        );
    }

    _createMainElement: (React$Element<*>, Object) => ?React$Element<*>;

    /**
     * Gets the default URL to be opened when this {@code App} mounts.
     *
     * @protected
     * @returns {string} The default URL to be opened when this {@code App}
     * mounts.
     */
    _getDefaultURL() {
        return getDefaultURL(this.state.store);
    }

    /**
     * Navigates this {@code AbstractApp} to (i.e. opens) a specific URL.
     *
     * @param {Object|string} url - The URL to navigate this {@code AbstractApp}
     * to (i.e. the URL to open).
     * @protected
     * @returns {void}
     */
    _openURL(url) {
        this.state.store.dispatch(appNavigate(toURLString(url)));
    }
}
