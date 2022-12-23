/* eslint-disable lines-around-comment */

// @ts-ignore
import { randomInt } from '@jitsi/js-utils/random';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import type { Dispatch } from 'redux';

import { appNavigate, reloadNow } from '../../../../app/actions.native';
import { IReduxState } from '../../../../app/types';
import { translate } from '../../../i18n/functions';
import { getFatalError } from '../../../lib-jitsi-meet/functions.native';
import { connect } from '../../../redux/functions';
// @ts-ignore
import { ConfirmDialog } from '../../index';


/**
 * The type of the React {@code Component} props of
 * {@link PageReloadDialog}.
 */
interface IPageReloadDialogProps extends WithTranslation {
    details: Object;
    dispatch: Dispatch<any>;
    message: string;
    reason: string;
    title: string;
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

    // @ts-ignore
    _interval: IntervalID;

    /**
     * Initializes a new PageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props: IPageReloadDialogProps) {
        super(props);

        // @ts-ignore
        this.state = {
            timeLeft: 10 + randomInt(0, 20)
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
        const { dispatch } = this.props;
        const { timeLeft } = this.state;

        this._interval
            = setInterval(
            () => {
                if (timeLeft === 0) {
                    if (this._interval) {
                        clearInterval(this._interval);
                        this._interval = undefined;
                    }

                    dispatch(reloadNow());
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
        const { message, t, title } = this.props;
        const { timeLeft } = this.state;

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
 *     message: string,
 *     reason: string,
 *     title: string
 * }}
 */
function mapStateToProps(state: IReduxState) {
    const {
        message,
        reason,
        title
    } = getFatalError(state);

    return {
        message,
        reason,
        title
    };
}

export default translate(connect(mapStateToProps)(PageReloadDialog));
