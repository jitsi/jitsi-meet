import React, { Component } from 'react';

import { Label } from '@atlaskit/field-base';
import Toggle from '@atlaskit/toggle';

import { DIALOG_PROP_TYPES } from '../constants';
import Dialog from './Dialog';

import { translate } from '../../i18n';
import jitsiLocalStorage from '../../../../../modules/util/JitsiLocalStorage';

/**
 * Implements a message dialog with an option do not show again component.
 */
class MessageDialog extends Component {
    /**
     * {@code MessageDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...DIALOG_PROP_TYPES,

        /**
         * This is the body of the dialog, the component children. (optional)
         */
        children: React.PropTypes.node,

        /**
         * A (optional) message to be displayed along with children components
         * of the dialog.
         */
        doNotShowWarningTextKey: React.PropTypes.string,

        /**
         * A (optional) message to be displayed along with children components
         * of the dialog. This is the key to be stored in local storage
         * to indicate that this dialog should not be shown again if desired by
         * the user.
         */
        localStorageKeyForDoNotShowWarning: React.PropTypes.string,

        /**
         * A (optional) message to be displayed along with children components
         * of the dialog.
         */
        message: React.PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: React.PropTypes.func
    };

    /**
     * Initializes a new {@code MessageDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            doNotShowWarningChecked: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDontShowChanged = this._onDontShowChanged.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const doNotShowWarning = this._renderDoNotShowWarning();

        return (
            <Dialog
                onSubmit = { this._onSubmit }
                { ...this.props }>
                { this.props.message }
                { this.props.children }
                { doNotShowWarning }
            </Dialog>
        );
    }

    /**
     * Creates a 'do not show dialog' component that contains a toggle which
     * user can use to indicate that this is the last time he sees this dialog.
     * If 'do not show dialog' component is not enabled returns null.
     *
     * @private
     * @returns {ReactComponent|null}
     */
    _renderDoNotShowWarning() {
        if (!this.props.doNotShowWarningTextKey) {
            return null;
        }

        return (
            <h5>
                <Label
                    label
                    = { this.props.t(this.props.doNotShowWarningTextKey) } />
                <Toggle onChange = { this._onDontShowChanged } />
            </h5>);
    }

    /**
     * Updates state when toggle state changes.
     *
     * @param {Object} e - The event coming from Toggle component.
     * @private
     * @returns {void}
     */
    _onDontShowChanged(e) {
        this.setState({
            doNotShowWarningChecked: e.target.checked
        });
    }

    /**
     * Dispatches the action when submitting the dialog. If
     * 'do not show dialog' component is enabled and its toggle is checked
     * store the desired value in localstorage in order to dismiss future
     * dialogs like current one.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        if (this.state.doNotShowWarningChecked) {
            jitsiLocalStorage.setItem(
                this.props.localStorageKeyForDoNotShowWarning, 'true');
        }

        return true;
    }
}

export default translate(MessageDialog);
