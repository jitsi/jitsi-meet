// @flow

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractGrantModeratorButton, {
    _mapStateToProps
} from '../AbstractGrantModeratorButton';

export default translate(connect(_mapStateToProps)(AbstractGrantModeratorButton));
