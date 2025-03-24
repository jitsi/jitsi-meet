import { Component } from 'react';

import { IStore } from '../../../../app/types';
import { hideDialog } from '../../actions';
import { DialogProps } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link AbstractDialog}.
 */
export interface IProps extends DialogProps {

    /**
     * Used to show/hide the dialog on cancel.
     */
    dispatch: IStore['dispatch'];
}

/**
 * The type of the React {@code Component} state of {@link AbstractDialog}.
 */
export interface IState {
    submitting?: boolean;
}

/**
 * An abstract implementation of a dialog on Web/React and mobile/react-native.
 */
export default class AbstractDialog<P extends IProps, S extends IState = IState>
    extends Component<P, S> {

    _mounted: boolean;

    /**
     * Initializes a new {@code AbstractDialog} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onSubmitFulfilled = this._onSubmitFulfilled.bind(this);
        this._onSubmitRejected = this._onSubmitRejected.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately before mounting occurs.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        this._mounted = true;
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}. Invoked
     * immediately before this component is unmounted and destroyed.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._mounted = false;
    }

    /**
     * Dispatches a redux action to hide this dialog.
     *
     * @returns {*} The return value of {@link hideDialog}.
     */
    _hide() {
        return this.props.dispatch(hideDialog());
    }

    /**
     * Dispatches a redux action to hide this dialog when it's canceled.
     *
     * @protected
     * @returns {void}
     */
    _onCancel() {
        const { cancelDisabled = false, onCancel } = this.props;

        if (!cancelDisabled && (!onCancel || onCancel())) {
            this._hide();
        }
    }

    /**
     * Submits this {@code Dialog}. If the React {@code Component} prop
     * {@code onSubmit} is defined, the function that is the value of the prop
     * is invoked. If the function returns a {@code thenable}, then the
     * resolution of the {@code thenable} is awaited. If the submission
     * completes successfully, a redux action will be dispatched to hide this
     * dialog.
     *
     * @protected
     * @param {string} [value] - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value?: string) {
        const { okDisabled = false, onSubmit } = this.props;

        if (!okDisabled) {
            this.setState({ submitting: true });

            // Invoke the React Component prop onSubmit if any.
            const r = !onSubmit || onSubmit(value);

            // If the invocation returns a thenable, await its resolution;
            // otherwise, treat the return value as a boolean indicating whether
            // the submission has completed successfully.
            let then;

            if (r) {
                switch (typeof r) {
                case 'function':
                case 'object':
                    then = r.then;
                    break;
                }
            }
            if (typeof then === 'function' && then.length === 2) {
                then.call(r, this._onSubmitFulfilled, this._onSubmitRejected);
            } else if (r) {
                this._onSubmitFulfilled();
            } else {
                this._onSubmitRejected();
            }
        }
    }

    /**
     * Notifies this {@code AbstractDialog} that it has been submitted
     * successfully. Dispatches a redux action to hide this dialog after it has
     * been submitted.
     *
     * @private
     * @returns {void}
     */
    _onSubmitFulfilled() {
        this._mounted && this.setState({ submitting: false });

        this._hide();
    }

    /**
     * Notifies this {@code AbstractDialog} that its submission has failed.
     *
     * @private
     * @returns {void}
     */
    _onSubmitRejected() {
        this._mounted && this.setState({ submitting: false });
    }
}
