/* global interfaceConfig */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { CallOverlay } from '../../base/jwt';

import PageReloadFilmstripOnlyOverlay from './PageReloadFilmstripOnlyOverlay';
import PageReloadOverlay from './PageReloadOverlay';
import SuspendedFilmstripOnlyOverlay from './SuspendedFilmstripOnlyOverlay';
import SuspendedOverlay from './SuspendedOverlay';
import UserMediaPermissionsFilmstripOnlyOverlay
    from './UserMediaPermissionsFilmstripOnlyOverlay';
import UserMediaPermissionsOverlay from './UserMediaPermissionsOverlay';

/**
 * Reference to the lazily loaded list of overlays.
 */
let _overlays;

/**
 * Returns the list of overlays which can be rendered by this container. The
 * list is lazily loaded the first time it's required.
 *
 * @returns {Array} - The list of overlay types which are available.
 */
function getOverlays() {
    if (typeof _overlays === 'undefined') {
        const filmstripOnly
            = typeof interfaceConfig === 'object'
                && interfaceConfig.filmStripOnly;

        if (filmstripOnly) {
            _overlays = [
                PageReloadFilmstripOnlyOverlay,
                SuspendedFilmstripOnlyOverlay,
                UserMediaPermissionsFilmstripOnlyOverlay
            ];
        } else {
            _overlays = [
                PageReloadOverlay,
                SuspendedOverlay,
                UserMediaPermissionsOverlay,
                CallOverlay
            ];
        }
    }

    return _overlays;
}

/**
 * Implements a React Component that will display the correct overlay when
 * needed.
 */
class OverlayContainer extends Component {
    /**
     * OverlayContainer component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Type of overlay that should be rendered.
         */
        overlay: PropTypes.element
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement|null}
     * @public
     */
    render() {
        const { overlay } = this.props;

        return overlay ? React.createElement(overlay, {}) : null;
    }
}

/**
 * Maps (parts of) the redux state to the associated OverlayContainer's props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *      overlay: ?Object
 * }}
 * @private
 */
function _mapStateToProps(state) {
    let overlay;

    for (const o of getOverlays()) {
        // react-i18n / react-redux wrap components and thus we cannot access
        // the wrapped component's static methods directly.
        const component = o.WrappedComponent || o;

        if (component.needsRender(state)) {
            overlay = o;
            break;
        }
    }

    return {
        /**
         * Type of overlay that should be rendered.
         */
        overlay
    };
}

export default connect(_mapStateToProps)(OverlayContainer);
