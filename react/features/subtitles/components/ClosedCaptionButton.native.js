// @flow

import { getFeatureFlag, CLOSE_CAPTIONS_ENABLED } from '../../base/flags';
import { translate } from '../../base/i18n';
import { IconClosedCaption } from '../../base/icons';
import { connect } from '../../base/redux';

import {
    AbstractClosedCaptionButton,
    _abstractMapStateToProps
} from './AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
    extends AbstractClosedCaptionButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    icon = IconClosedCaption;
    label = 'transcribing.start';
    toggledLabel = 'transcribing.stop';
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: Object, ownProps: Object) {
    const { transcribingEnabled } = state['features/base/config'];
    const enabled = getFeatureFlag(state, CLOSE_CAPTIONS_ENABLED, true) && transcribingEnabled;
    const { visible = enabled } = ownProps;

    return {
        ..._abstractMapStateToProps(state, ownProps),
        visible
    };
}

export default translate(connect(mapStateToProps)(ClosedCaptionButton));
