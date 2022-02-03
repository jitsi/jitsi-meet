// @flow

import React from 'react';

import { appNavigate, reloadNow } from '../../../app/actions';
import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { setFatalError, setPageReloadOverlayCanceled } from '../../actions';
import AbstractPageReloadOverlay, {
    abstractMapStateToProps,
    type Props
} from '../AbstractPageReloadOverlay';

import OverlayFrame from './OverlayFrame';


/**
 * Implements a React Component for page reload overlay. Shown before the
 * conference is reloaded. Shows a warning message and counts down towards the
 * reload.
 */
class PageReloadOverlay extends AbstractPageReloadOverlay<Props> {
    _interval: IntervalID;

    /**
     * Initializes a new PageReloadOverlay instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     * @public
     */
    constructor(props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._onReloadNow = this._onReloadNow.bind(this);
    }

    _onCancel: () => void;

    /**
     * Handle clicking of the "Cancel" button. It will navigate back to the
     * welcome page.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        clearInterval(this._interval);
        this.props.dispatch(setPageReloadOverlayCanceled(this.props.error));
        this.props.dispatch(setFatalError(undefined));
        this.props.dispatch(appNavigate(undefined));
    }

    _onReloadNow: () => void;

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
            <OverlayFrame>
                <ConfirmDialog
                    cancelLabel = 'dialog.Cancel'
                    confirmLabel = 'dialog.rejoinNow'
                    descriptionKey = { `${t(message, { seconds: timeLeft })}` }
                    onCancel = { this._onCancel }
                    onSubmit = { this._onReloadNow }
                    title = { title } />
            </OverlayFrame>
        );
    }
}

export default translate(connect(abstractMapStateToProps)(PageReloadOverlay));
