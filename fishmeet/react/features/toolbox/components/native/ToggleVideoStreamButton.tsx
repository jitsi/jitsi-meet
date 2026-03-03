import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import AbstractToggleVideoStreamButton, { IProps, mapStateToProps }
    from '../AbstractToggleVideoStreamButton';

export default translate(connect(mapStateToProps)(AbstractToggleVideoStreamButton<IProps>));
