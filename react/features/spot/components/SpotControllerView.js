// @flow

import { SpotView } from 'jitsi-spot-sdk';
import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import { HeaderWithNavigation, Modal } from '../../base/react';
import { connect } from '../../base/redux';

import { toggleSpotControllerView } from '../actions';

import styles from './styles';

type Props = {
    _device: Object,
    _headerStyles: Object,
    _visible: boolean,
    dispatch: Function
};

/**
 * Implements a view to display the {@code SpotView} component
 * of the Spot SDK.
 */
class SpotControllerView extends PureComponent<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onRequestClose = this._onRequestClose.bind(this);
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     */
    render() {
        const { _device, _headerStyles, _visible } = this.props;

        return (
            <Modal
                onRequestClose = { this._onRequestClose }
                presentationStyle = 'overFullScreen'
                visible = { _visible }>
                <View style = { _headerStyles.page }>
                    <HeaderWithNavigation
                        headerLabelKey = 'spot.controllerViewTitle'
                        onPressBack = { this._onRequestClose } />
                    <SpotView
                        device = { _device }
                        style = { styles.spotView } />
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
        this.props.dispatch(toggleSpotControllerView(false));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {$Shape<Props>}
 */
function _mapStateToProps(state: Object): $Shape<Props> {
    const { device, showControllerView } = state['features/spot'];

    return {
        _device: device,
        _headerStyles: ColorSchemeRegistry.get(state, 'Header'),
        _visible: showControllerView
    };
}

export default connect(_mapStateToProps)(SpotControllerView);
