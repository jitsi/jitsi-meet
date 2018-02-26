import Button from '@atlaskit/button';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import { openDeviceSelectionDialog } from '../../../device-selection';

/**
 * Implements a React {@link Component} which displays a button for opening the
 * {@code DeviceSelectionDialog}.
 *
 * @extends Component
 */
class DeviceSelectionButton extends Component {
    /**
     * {@code DeviceSelectionButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Invoked to display the {@code DeviceSelectionDialog}.
         */
        dispatch: PropTypes.func,

        /**
         * Whether or not the button's title should be displayed.
         */
        showTitle: PropTypes.bool,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code DeviceSelectionButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onOpenDeviceSelectionDialog
            = this._onOpenDeviceSelectionDialog.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div>
                { this.props.showTitle
                    ? <div className = 'subTitle'>
                        { this.props.t('settings.audioVideo') }
                    </div>
                    : null }
                <Button
                    appearance = 'primary'
                    onClick = { this._onOpenDeviceSelectionDialog }
                    shouldFitContainer = { true }>
                    { this.props.t('deviceSelection.deviceSettings') }
                </Button>
            </div>
        );
    }

    /**
     * Opens the {@code DeviceSelectionDialog}.
     *
     * @private
     * @returns {void}
     */
    _onOpenDeviceSelectionDialog() {
        this.props.dispatch(openDeviceSelectionDialog());
    }
}

export default translate(connect()(DeviceSelectionButton));
