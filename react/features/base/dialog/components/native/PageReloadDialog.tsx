/* eslint-disable lines-around-comment */

// @ts-ignore
import { randomInt } from '@jitsi/js-utils/random';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import type { Dispatch } from 'redux';
import { appNavigate, reloadNow } from '../../../../app/actions.native';
import { IReduxState } from '../../../../app/types';
// @ts-ignore
import { ConfirmDialog } from '../../index';
import { translate } from '../../../i18n/functions';
import { connect } from '../../../redux/functions';
import logger from "../../../../overlay/logger";


/**
 * The type of the React {@code Component} props of
 * {@link PageReloadDialog}.
 */
interface Props extends WithTranslation  {
    details: Object;
    dispatch: Dispatch<any>;
    isNetworkFailure: boolean;
    reason: string;
}

/**
 * The type of the React {@code Component} state of
 * {@link PageReloadDialog}.
 */
interface State {
    message: string;
    timeLeft: number;
    timeoutSeconds: number;
    title: string;
}


/**
 * Implements a React Component that is shown before the
 * conference is reloaded.
 * Shows a warning message and counts down towards the re-load.
 */
class PageReloadOverlay extends Component<Props, State> {

    // @ts-ignore
    _interval: IntervalID;

    /**
     * Initializes a new PageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props: Props) {
        super(props);

        /**
         * How long the overlay dialog will be displayed, before the conference
         * will be reloaded.
         *
         * @type {number}
         */
        const timeoutSeconds = 10 + randomInt(0, 20);

        let message, title;

        if (this.props.isNetworkFailure) {
            title = 'dialog.conferenceDisconnectTitle';
            message = 'dialog.conferenceDisconnectMsg';
        } else {
            title = 'dialog.conferenceReloadTitle';
            message = 'dialog.conferenceReloadMsg';
        }

        this.state = {
            message,
            timeLeft: timeoutSeconds,
            // @ts-ignore
            timeoutSeconds,
            title
        };

        this._onCancel = this._onCancel.bind(this);
        this._onReloadNow = this._onReloadNow.bind(this);
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (typeof APP !== 'undefined') {
            if (APP.conference && APP.conference._room) {
                APP.conference._room.sendApplicationLog(JSON.stringify({
                    name: 'page.reload',
                    label: this.props.reason
                }));
            }
        }

        this._interval
            = setInterval(
            () => {
                if (this.state.timeLeft === 0) {
                    if (this._interval) {
                        clearInterval(this._interval);
                        this._interval = undefined;
                    }

                    this.props.dispatch(reloadNow());
                } else {
                    this.setState(prevState => {
                        return {
                            timeLeft: prevState.timeLeft - 1
                        };
                    });
                }
            },
            1000);
    }

    /**
     * Clears the timer interval.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = undefined;
        }
    }

    /**
     * Handle clicking of the "Cancel" button. It will navigate back to the
     * welcome page.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        clearInterval(this._interval);
        this.props.dispatch(appNavigate(undefined));
    }

    /**
     * Handle clicking on the "Reload Now" button. It will navigate to the same
     * conference URL as before immediately, without waiting for the timer to
     * kick in.
     *
     * @private
     * @returns {void}
     */
    _onReloadNow() {
        clearInterval(this._interval);
        this.props.dispatch(reloadNow());
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;
        const { message, timeLeft, title } = this.state;

        return (
            <ConfirmDialog
                cancelLabel = 'dialog.Cancel'
                confirmLabel = 'dialog.rejoinNow'
                descriptionKey = { `${ t(message, { seconds: timeLeft }) }` }
                onCancel = { this._onCancel }
                onSubmit = { this._onReloadNow }
                title = { title } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated component's props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     details: Object,
 *     error: ?Error,
 *     isNetworkFailure: boolean,
 *     reason: string
 * }}
 */
function mapStateToProps(state: IReduxState) {
    const { error: conferenceError } = state['features/base/conference'];
    const { error: configError } = state['features/base/config'];
    const { error: connectionError } = state['features/base/connection'];

    let reason;

    if (conferenceError) {
        reason = `error.conference.${conferenceError.name}`;
    } else if (configError) {
        reason = `error.config.${configError.name}`;
    } else if (connectionError) {
        reason = `error.connection.${connectionError.name}`;
    } else {
        logger.error('No reload reason defined!');
    }

    return {
        isNetworkFailure: configError || connectionError,
        reason
    };
}

export default translate(connect(mapStateToProps)(PageReloadOverlay));
