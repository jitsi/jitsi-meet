import React from 'react';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';

import { appNavigate } from '../../app';
import { translate } from '../../base/i18n';
import { LoadingIndicator } from '../../base/react';

import AbstractPageReloadOverlay, { abstractMapStateToProps }
    from './AbstractPageReloadOverlay';
import { _reloadNow, setFatalError } from '../actions';
import OverlayFrame from './OverlayFrame';
import { pageReloadOverlay as styles } from './styles';

/**
 * Implements a React Component for page reload overlay. Shown before the
 * conference is reloaded. Shows a warning message and counts down towards the
 * reload.
 */
class PageReloadOverlay extends AbstractPageReloadOverlay {
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
        this.props.dispatch(_reloadNow());
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
                <View style = { styles.container }>
                    <View style = { styles.loadingIndicator }>
                        <LoadingIndicator />
                    </View>
                    <Text style = { styles.title }>
                        { t(title) }
                    </Text>
                    <Text style = { styles.message }>
                        { t(message, { seconds: timeLeft }) }
                    </Text>
                    <View style = { styles.buttonBox }>
                        <Text
                            onPress = { this._onReloadNow }
                            style = { styles.button } >
                            { t('dialog.rejoinNow') }
                        </Text>
                        <Text
                            onPress = { this._onCancel }
                            style = { styles.button } >
                            { t('dialog.Cancel') }
                        </Text>
                    </View>
                </View>
            </OverlayFrame>
        );
    }
}

export default translate(connect(abstractMapStateToProps)(PageReloadOverlay));
