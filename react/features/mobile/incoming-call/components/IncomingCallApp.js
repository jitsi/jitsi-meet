// @flow

import { BaseApp } from '../../../base/app';
import { incomingCallReceived } from '../actions';

import IncomingCallPage from './IncomingCallPage';

/**
 * The type of the React {@code Component} props of {@link IncomingCallApp}.
 */
type Props = {

    /**
     * URL of the avatar for the caller.
     */
    callerAvatarURL: string,

    /**
     * Name of the caller.
     */
    callerName: string,

    /**
     * Whether this is a video call or not.
     */
    hasVideo: boolean
};

/**
 * Root application component for incoming call.
 *
 * @extends BaseApp
 */
export default class IncomingCallApp extends BaseApp<Props> {
    _init: Promise<*>;

    /**
     * Navigates to {@link IncomingCallPage} upon mount.
     *
     * NOTE: This was implemented here instead of in a middleware for the
     * {@link APP_WILL_MOUNT} action because that would run also for
     * {@link App}.
     *
     * @returns {void}
     */
    componentDidMount() {
        super.componentDidMount();

        this._init.then(() => {
            const { dispatch } = this.state.store;
            const {
                callerAvatarURL: avatarUrl,
                callerName: name,
                hasVideo
            } = this.props;

            dispatch(incomingCallReceived({
                avatarUrl,
                hasVideo,
                name
            }));

            super._navigate({ component: IncomingCallPage });
        });
    }
}
