import { batch, connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { TILE_VIEW_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { translate } from '../../base/i18n/functions';
import { IconTileView } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions';
import { setTileView } from '../actions';
import { shouldDisplayTileView } from '../functions';
import logger from '../logger';

/**
 * The type of the React {@code Component} props of {@link TileViewButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether or not tile view layout has been enabled as the user preference.
     */
    _tileViewEnabled: boolean;
}

/**
 * Component that renders a toolbar button for toggling the tile layout view.
 *
 * @augments AbstractButton
 */
class TileViewButton<P extends IProps> extends AbstractButton<P> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.enterTileView';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.exitTileView';
    override icon = IconTileView;
    override label = 'toolbar.enterTileView';
    override toggledLabel = 'toolbar.exitTileView';
    override tooltip = 'toolbar.tileViewToggle';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { _tileViewEnabled, dispatch } = this.props;

        const value = !_tileViewEnabled;

        sendAnalytics(createToolbarEvent(
            'tileview.button',
            {
                'is_enabled': value
            }));

        logger.debug(`Tile view ${value ? 'enable' : 'disable'}`);
        batch(() => {
            dispatch(setTileView(value));
            navigator.product !== 'ReactNative' && dispatch(setOverflowMenuVisible(false));
        });

    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._tileViewEnabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code TileViewButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const enabled = getFeatureFlag(state, TILE_VIEW_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _tileViewEnabled: shouldDisplayTileView(state),
        visible
    };
}

export default translate(connect(_mapStateToProps)(TileViewButton));
