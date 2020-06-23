// @flow

import React from 'react';
import { Text } from 'react-native';

import { appNavigate, reloadNow } from '../../../app/actions';
import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { ConfirmDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { setFatalError } from '../../actions';
import AbstractPageReloadOverlay, {
    abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractPageReloadOverlay';

import OverlayFrame from './OverlayFrame';

type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the base/dialog feature.
     */
    _dialogStyles: StyleType
}

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

    _onCancel: () => void

    /**
     * Handle clicking of the "Cancel" button. It will navigate back to the
     * welcome page.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        clearInterval(this._interval);
        this.props.dispatch(setFatalError(undefined));
        this.props.dispatch(appNavigate(undefined));
    }

    _onReloadNow: () => void

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
        const { _dialogStyles, t } = this.props;
        const { message, timeLeft, title } = this.state;

        return (
            <OverlayFrame>
                <ConfirmDialog
                    cancelKey = 'dialog.Cancel'
                    okKey = 'dialog.rejoinNow'
                    onCancel = { this._onCancel }
                    onSubmit = { this._onReloadNow }>
                    <Text style = { _dialogStyles.text }>
                        { `${t(title)} ${t(message, { seconds: timeLeft })}` }
                    </Text>
                </ConfirmDialog>
            </OverlayFrame>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _dialogStyles: StyleType
 * }}
 */
function _mapStateToProps(state) {
    return {
        ...abstractMapStateToProps(state),
        _dialogStyles: ColorSchemeRegistry.get(state, 'Dialog')
    };
}

export default translate(connect(_mapStateToProps)(PageReloadOverlay));
