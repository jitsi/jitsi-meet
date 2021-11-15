// @flow
import { batch } from 'react-redux';
import type { Dispatch } from 'redux';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import { TILE_VIEW_ENABLED, getFeatureFlag } from '../../base/flags';
import { translate } from '../../base/i18n';
import { IconTileView } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { setOverflowMenuVisible } from '../../toolbox/actions';
import { setTileView } from '../actions';
import { shouldDisplayTileView } from '../functions';
import logger from '../logger';

/**
 * The type of the React {@code Component} props of {@link TileViewButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not tile view layout has been enabled as the user preference.
     */
    _tileViewEnabled: boolean,

    /**
     * Used to dispatch actions from the buttons.
     */
    dispatch: Dispatch<any>
};

/**
 * Component that renders a toolbar button for toggling the tile layout view.
 *
 * @augments AbstractButton
 */
class TileViewButton<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.tileView';
    icon = IconTileView;
    label = 'toolbar.enterTileView';
    toggledLabel = 'toolbar.exitTileView';
    tooltip = 'toolbar.tileViewToggle';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _tileViewEnabled, dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        const value = !_tileViewEnabled;

        sendAnalytics(createToolbarEvent(
            'tileview.button',
            {
                'is_enabled': value
            }));

        logger.debug(`Tile view ${value ? 'enable' : 'disable'}`);
        batch(() => {
            dispatch(setTileView(value));
            dispatch(setOverflowMenuVisible(false));
        });

    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._tileViewEnabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code TileViewButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const enabled = getFeatureFlag(state, TILE_VIEW_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _tileViewEnabled: shouldDisplayTileView(state),
        visible
    };
}

export default translate(connect(_mapStateToProps)(TileViewButton));
