import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import AbstractAudioMuteButton, { IProps, mapStateToProps } from '../AbstractAudioMuteButton';

export default translate(connect(mapStateToProps)(AbstractAudioMuteButton<IProps>));
