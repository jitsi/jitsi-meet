import BaseApp from '../../base/app/components/BaseApp';
import { toURLString } from '../../base/util/uri';
import { appNavigate } from '../actions';
import { getDefaultURL } from '../functions';

/**
 * The type of React {@code Component} props of {@link AbstractApp}.
 */
export interface IProps {

    /**
     * XXX Refer to the implementation of loadURLObject: in
     * ios/sdk/src/JitsiMeetView.m for further information.
     */
    timestamp: number;

    /**
     * The URL, if any, with which the app was launched.
     */
    url: Object | string;
}

/**
 * Base (abstract) class for main App component.
 *
 * @abstract
 */
export class AbstractApp<P extends IProps = IProps> extends BaseApp<P> {
    /**
     * The deferred for the initialisation {{promise, resolve, reject}}.
     */
    _init: {
        promise: Promise<any>;
    };

    /**
     * Initializes the app.
     *
     * @inheritdoc
     */
    async componentDidMount() {
        await super.componentDidMount();

        // If a URL was explicitly specified to this React Component, then
        // open it; otherwise, use a default.
        this._openURL(toURLString(this.props.url) || this._getDefaultURL());
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    async componentDidUpdate(prevProps: IProps) {
        const previousUrl = toURLString(prevProps.url);
        const currentUrl = toURLString(this.props.url);
        const previousTimestamp = prevProps.timestamp;
        const currentTimestamp = this.props.timestamp;

        await this._init.promise;

        // Deal with URL changes.

        if (previousUrl !== currentUrl

            // XXX Refer to the implementation of loadURLObject: in
            // ios/sdk/src/JitsiMeetView.m for further information.
            || previousTimestamp !== currentTimestamp) {
            this._openURL(currentUrl || this._getDefaultURL());
        }
    }

    /**
     * Gets the default URL to be opened when this {@code App} mounts.
     *
     * @protected
     * @returns {string} The default URL to be opened when this {@code App}
     * mounts.
     */
    _getDefaultURL() {
        // @ts-ignore
        return getDefaultURL(this.state.store);
    }

    /**
     * Navigates this {@code AbstractApp} to (i.e. Opens) a specific URL.
     *
     * @param {Object|string} url - The URL to navigate this {@code AbstractApp}
     * to (i.e. The URL to open).
     * @protected
     * @returns {void}
     */
    _openURL(url: string | Object) {
        this.state.store?.dispatch(appNavigate(toURLString(url)));
    }
}
