import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import AbstractGrantModeratorButton, {
    _mapStateToProps
} from '../AbstractGrantModeratorButton';

export default translate(connect(_mapStateToProps)(AbstractGrantModeratorButton));
