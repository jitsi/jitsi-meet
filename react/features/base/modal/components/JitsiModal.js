// @flow

import React, { PureComponent } from 'react';
import { KeyboardAvoidingView, SafeAreaView } from 'react-native';

import { ColorSchemeRegistry } from '../../color-scheme';
import { HeaderWithNavigation, SlidingView } from '../../react';
import { connect } from '../../redux';
import { StyleType } from '../../styles';

import { setActiveModalId } from '../actions';

import styles from './styles';

type Props = {

    /**
     * The color schemed style of the common header component.
     */
    _headerStyles: StyleType,

    /**
     * True if the modal should be shown, false otherwise.
     */
    _show: boolean,

    /**
     * The color schemed style of the modal.
     */
    _styles: StyleType,

    /**
     * The children component(s) of the Modal, to be rendered.
     */
    children: React$Node,

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Optional function that renders a footer component, if needed.
     */
    footerComponent?: Function,

    /**
     * Props to be passed over to the header.
     *
     * See {@code HeaderWithNavigation} for more details.
     */
    headerProps: Object,

    /**
     * The ID of the modal that is being rendered. This is used to show/hide the modal.
     */
    modalId: string,

    /**
     * Callback to be invoked when the modal closes.
     */
    onClose?: Function,

    /**
     * The position from where the modal should be opened. This is derived from the
     * props of the {@code SlidingView} with the same name.
     */
    position?: string,

    /**
     * Additional style to be appended to the View containing the content of the modal.
     */
    style?: StyleType
};

/**
 * Implements a custom Jitsi Modal that doesn't use the built in native
 * Modal component of React Native.
 */
class JitsiModal extends PureComponent<Props> {
    static defaultProps = {
        position: 'bottom'
    };

    /**
     * Instantiates a new component.
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
        const { _headerStyles, _show, _styles, children, footerComponent, headerProps, position, style } = this.props;

        return (
            <SlidingView
                onHide = { this._onRequestClose }
                position = { position }
                show = { _show }>
                <KeyboardAvoidingView
                    behavior = 'height'
                    style = { [
                        _headerStyles.page,
                        _styles.page,
                        style
                    ] }>
                    <HeaderWithNavigation
                        { ...headerProps }
                        onPressBack = { this._onRequestClose } />
                    <SafeAreaView style = { styles.safeArea }>
                        { children }
                    </SafeAreaView>
                    { footerComponent && footerComponent() }
                </KeyboardAvoidingView>
            </SlidingView>
        );
    }

    _onRequestClose: () => boolean;

    /**
     * Callback to be invoked when the SlidingView requests closing.
     *
     * @returns {boolean}
     */
    _onRequestClose() {
        const { _show, dispatch, onClose } = this.props;
        let shouldCloseModal = true;

        if (_show) {
            if (typeof onClose === 'function') {
                shouldCloseModal = onClose();
            }
            shouldCloseModal && dispatch(setActiveModalId());

            return shouldCloseModal;
        }

        return false;
    }
}

/**
 * Maps part of the Redix state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps): $Shape<Props> {
    return {
        _headerStyles: ColorSchemeRegistry.get(state, 'Header'),
        _show: state['features/base/modal'].activeModalId === ownProps.modalId,
        _styles: ColorSchemeRegistry.get(state, 'Modal')
    };
}

export default connect(_mapStateToProps)(JitsiModal);
