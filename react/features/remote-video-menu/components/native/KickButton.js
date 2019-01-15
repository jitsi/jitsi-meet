// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import AbstractKickButton from '../AbstractKickButton';

/**
 * We don't need any further implementation for this on mobile, but we keep it
 * here for clarity and consistency with web. Once web uses the
 * {@code AbstractButton} base class, we can remove all these and just use
 * the {@code AbstractKickButton} as {@KickButton}.
 */
export default translate(connect()(AbstractKickButton));
