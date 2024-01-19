import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import { getSharedDocumentUrl } from '../../functions';

import styles, { INDICATOR_COLOR } from './styles';

/**
 * The type of the React {@code Component} props of {@code ShareDocument}.
 */
interface IProps extends WithTranslation {

    /**
     * URL for the shared document.
     */
    _documentUrl?: string;

    /**
     * Default prop for navigation between screen components(React Navigation).
     */
    navigation: Object;
}

/**
 * Implements a React native component that renders the shared document window.
 */
class SharedDocument extends PureComponent<IProps> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

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
            <JitsiScreen
                style = { styles.sharedDocContainer }>
                <WebView
                    hideKeyboardAccessoryView = { true }
                    renderLoading = { this._renderLoading }
                    source = {{ uri: _documentUrl ?? '' }}
                    startInLoadingState = { true }
                    style = { styles.sharedDoc } />
            </JitsiScreen>
        );
    }

    /**
     * Renders the loading indicator.
     *
     * @returns {React$Component<any>}
     */
    _renderLoading() {
        return (
            <View style = { styles.indicatorWrapper as ViewStyle }>
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
 * @param {any} _ownProps - Component's props.
 * @private
 * @returns {Object}
 */
export function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const documentUrl = getSharedDocumentUrl(state);

    return {
        _documentUrl: documentUrl
    };
}

export default translate(connect(_mapStateToProps)(SharedDocument));
