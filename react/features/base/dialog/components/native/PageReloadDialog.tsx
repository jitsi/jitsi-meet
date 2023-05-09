// @ts-expect-error
import { randomInt } from '@jitsi/js-utils/random';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { appNavigate, reloadNow } from '../../../../app/actions.native';
import { IReduxState, IStore } from '../../../../app/types';
import { translate } from '../../../i18n/functions';
import { isFatalJitsiConnectionError } from '../../../lib-jitsi-meet/functions.native';
import { hideDialog } from '../../actions';
import logger from '../../logger';

import ConfirmDialog from './ConfirmDialog';


/**
 * The type of the React {@code Component} props of
 * {@link PageReloadDialog}.
 */
interface IPageReloadDialogProps extends WithTranslation {
    dispatch: IStore['dispatch'];
    isNetworkFailure: boolean;
    reason?: string;
}

/**
 * The type of the React {@code Component} state of
 * {@link PageReloadDialog}.
 */
interface IPageReloadDialogState {
    timeLeft: number;
}

/**
 * Implements a React Component that is shown before the
 * conference is reloaded.
 * Shows a warning message and counts down towards the re-load.
 */
class PageReloadDialog extends Component<IPageReloadDialogProps, IPageReloadDialogState> {
    _interval?: number;
    _timeoutSeconds: number;

    /**
     * Initializes a new PageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props: IPageReloadDialogProps) {
        super(props);

        this._timeoutSeconds = 10 + randomInt(0, 20);

        this.state = {
            timeLeft: this._timeoutSeconds
        };

        this._onCancel = this._onCancel.bind(this);
        this._onReloadNow = this._onReloadNow.bind(this);
        this._onReconnecting = this._onReconnecting.bind(this);
    }

    /**
     * React Component method that executes once component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const { timeLeft } = this.state;

        logger.info(
            `The conference will be reloaded after ${timeLeft} seconds.`
        );

        this._interval = setInterval(() =>
            this._onReconnecting(), 1000);
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
     * @returns {boolean}
     */
    _onCancel() {
        const { dispatch } = this.props;

        clearInterval(this._interval ?? 0);
        dispatch(appNavigate(undefined));

        return true;
    }

    /**
     * Handles automatic reconnection.
     *
     * @private
     * @returns {void}
     */
    _onReconnecting() {
        const { dispatch } = this.props;
        const { timeLeft } = this.state;

        if (timeLeft === 0) {
            if (this._interval) {
                dispatch(hideDialog());
                this._onReloadNow();
                this._interval = undefined;
            }
        }

        this.setState({
            timeLeft: timeLeft - 1
        });
    }

    /**
     * Handle clicking on the "Reload Now" button. It will navigate to the same
     * conference URL as before immediately, without waiting for the timer to
     * kick in.
     *
     * @private
     * @returns {boolean}
     */
    _onReloadNow() {
        const { dispatch } = this.props;

        clearInterval(this._interval ?? 0);
        dispatch(reloadNow());

        return true;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isNetworkFailure, t } = this.props;
        const { timeLeft } = this.state;

        let message, title;

        if (isNetworkFailure) {
            title = 'dialog.conferenceDisconnectTitle';
            message = 'dialog.conferenceDisconnectMsg';
        } else {
            title = 'dialog.conferenceReloadTitle';
            message = 'dialog.conferenceReloadMsg';
        }

        return (
            <ConfirmDialog
                cancelLabel = 'dialog.Cancel'
                confirmLabel = 'dialog.rejoinNow'
                descriptionKey = { `${t(message, { seconds: timeLeft })}` }
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
 *     isNetworkFailure: boolean,
 *     reason: string
 * }}
 */
function mapStateToProps(state: IReduxState) {
    const { error: conferenceError } = state['features/base/conference'];
    const { error: configError } = state['features/base/config'];
    const { error: connectionError } = state['features/base/connection'];
    const { fatalError } = state['features/overlay'];

    const fatalConnectionError
        = connectionError && isFatalJitsiConnectionError(connectionError);
    const fatalConfigError = fatalError === configError;

    const isNetworkFailure = Boolean(fatalConfigError || fatalConnectionError);

    let reason;

    if (conferenceError) {
        reason = `error.conference.${conferenceError.name}`;
    } else if (connectionError) {
        reason = `error.conference.${connectionError.name}`;
    } else if (configError) {
        reason = `error.config.${configError.name}`;
    } else {
        logger.error('No reload reason defined!');
    }

    return {
        isNetworkFailure,
        reason
    };
}

export default translate(connect(mapStateToProps)(PageReloadDialog));
