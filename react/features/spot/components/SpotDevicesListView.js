// @flow

import { SpotNearbyDevicesList } from 'jitsi-spot-sdk';
import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import { translate } from '../../base/i18n';
import { HeaderWithNavigation, Modal } from '../../base/react';
import { connect } from '../../base/redux';

import { toggleSpotControllerView, toggleSpotDevicesList } from '../actions';

import styles from './styles';

type Props = {
    _headerStyles: Object,
    _visible: boolean,
    dispatch: Function,
    t: Function
};

/**
 * Implements a view to display the {@code SpotNearbyDevicesList} component
 * of the Spot SDK.
 */
class SpotDevicesListView extends PureComponent<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onRequestClose = this._onRequestClose.bind(this);
        this._onSelect = this._onSelect.bind(this);
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <Modal
                onRequestClose = { this._onRequestClose }
                presentationStyle = 'overFullScreen'
                visible = { this.props._visible }>
                <View style = { this.props._headerStyles.page }>
                    <HeaderWithNavigation
                        headerLabelKey = 'spot.devicesListViewTitle'
                        onPressBack = { this._onRequestClose } />
                    <SpotNearbyDevicesList
                        defaultDeviceName = { this.props.t('spot.defaultDeviceName') }
                        onSelect = { this._onSelect }
                        style = { styles.devicesList } />
                </View>
            </Modal>
        );
    }

    _onRequestClose: () => void;

    /**
     * Callback to be invoked on pressing the back button.
     *
     * @returns {void}
     */
    _onRequestClose() {
        this.props.dispatch(toggleSpotDevicesList(false));
    }

    _onSelect: Object => void;

    /**
     * Callback to be invoked on selecting a device from the list.
     *
     * @param {Object} device -  The selected device to connect to.
     * @returns {void}
     */
    _onSelect(device) {
        this._onRequestClose();
        this.props.dispatch(toggleSpotControllerView(true, device));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {$Shape<Props>}
 */
function _mapStateToProps(state: Object): $Shape<Props> {
    return {
        _headerStyles: ColorSchemeRegistry.get(state, 'Header'),
        _visible: state['features/spot'].showDevicesList
    };
}

export default translate(connect(_mapStateToProps)(SpotDevicesListView));
