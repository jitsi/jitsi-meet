// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import AbstractMuteButton, { _mapStateToProps } from '../AbstractMuteButton';

/**
 * We don't need any further implementation for this on mobile, but we keep it
 * here for clarity and consistency with web. Once web uses the
 * {@code AbstractButton} base class, we can remove all these and just use
 * the {@code AbstractMuteButton} as {@MuteButton}.
 */
export default translate(connect(_mapStateToProps)(AbstractMuteButton));
