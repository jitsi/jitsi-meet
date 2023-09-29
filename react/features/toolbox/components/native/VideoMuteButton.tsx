import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import AbstractVideoMuteButton, { IProps, mapStateToProps } from '../AbstractVideoMuteButton';


export default translate(connect(mapStateToProps)(AbstractVideoMuteButton<IProps>));
