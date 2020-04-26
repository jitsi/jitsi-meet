// @flow

import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Dispatch } from 'redux';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { translate } from '../../../base/i18n';
import { JitsiModal } from '../../../base/modal';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';

import { toggleDocument } from '../../actions';
import { SHARE_DOCUMENT_VIEW_ID } from '../../constants';
import { getSharedDocumentUrl } from '../../functions';

import styles, { INDICATOR_COLOR } from './styles';

/**
 * The type of the React {@code Component} props of {@code ShareDocument}.
 */
type Props = {

    /**
     * URL for the shared document.
     */
    _documentUrl: string,

    /**
     * Color schemed style of the header component.
     */
    _headerStyles: Object,

    /**
     * True if the chat window should be rendered.
     */
    _isOpen: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Dispatch<any>,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements a React native component that renders the shared document window.
 */
class SharedDocument extends PureComponent<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClose = this._onClose.bind(this);
        this._onError = this._onError.bind(this);
        this._renderLoading = this._renderLoading.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _documentUrl } = this.props;

        return (
            <JitsiModal
                headerProps = {{
                    headerLabelKey: 'documentSharing.title'
                }}
                modalId = { SHARE_DOCUMENT_VIEW_ID }
                style = { styles.webView }>
                <WebView
                    onError = { this._onError }
                    renderLoading = { this._renderLoading }
                    source = {{ uri: _documentUrl }}
                    startInLoadingState = { true } />
            </JitsiModal>
        );
    }

    _onClose: () => boolean

    /**
     * Closes the window.
     *
     * @returns {boolean}
     */
    _onClose() {
        const { _isOpen, dispatch } = this.props;

        if (_isOpen) {
            dispatch(toggleDocument());

            return true;
        }

        return false;
    }

    _onError: () => void;

    /**
     * Callback to handle the error if the page fails to load.
     *
     * @returns {void}
     */
    _onError() {
        const { _isOpen, dispatch } = this.props;

        if (_isOpen) {
            dispatch(toggleDocument());
        }
    }

    _renderLoading: () => React$Component<any>;

    /**
     * Renders the loading indicator.
     *
     * @returns {React$Component<any>}
     */
    _renderLoading() {
        return (
            <View style = { styles.indicatorWrapper }>
                <LoadingIndicator
                    color = { INDICATOR_COLOR }
                    size = 'large' />
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to {@link SharedDocument} React {@code Component} props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {Object}
 */
export function _mapStateToProps(state: Object) {
    const { editing } = state['features/etherpad'];
    const documentUrl = getSharedDocumentUrl(state);

    return {
        _documentUrl: documentUrl,
        _headerStyles: ColorSchemeRegistry.get(state, 'Header'),
        _isOpen: editing
    };
}

export default translate(connect(_mapStateToProps)(SharedDocument));
