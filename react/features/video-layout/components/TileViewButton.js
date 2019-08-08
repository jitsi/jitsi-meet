// @flow

import Logger from 'jitsi-meet-logger';
import type { Dispatch } from 'redux';

import {
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox';

import { setTileView } from '../actions';

const logger = Logger.getLogger(__filename);

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
 * @extends AbstractButton
 */
class TileViewButton<P: Props> extends AbstractButton<P, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.tileView';
    iconName = 'icon-tiles-many';
    label = 'toolbar.enterTileView';
    toggledLabel = 'toolbar.exitTileView';
    toggledIconName = 'icon-tiles-many toggled';
    tooltip = 'toolbar.tileViewToggle';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _tileViewEnabled, dispatch } = this.props;

        sendAnalytics(createToolbarEvent(
            'tileview.button',
            {
                'is_enabled': _tileViewEnabled
            }));
        const value = !_tileViewEnabled;

        logger.debug(`Tile view ${value ? 'enable' : 'disable'}`);
        dispatch(setTileView(value));
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
 * @returns {{
 *     _tileViewEnabled: boolean
 * }}
 */
function _mapStateToProps(state) {
    return {
        _tileViewEnabled: state['features/video-layout'].tileViewEnabled
    };
}

export default translate(connect(_mapStateToProps)(TileViewButton));
