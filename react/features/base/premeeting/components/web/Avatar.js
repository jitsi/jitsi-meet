// @flow

import React from 'react';

import { Avatar } from '../../../avatar';
import { connect } from '../../../redux';
import { calculateAvatarDimensions } from '../../functions';

type Props = {

   /**
    * The height of the window.
    */
    height: number,

   /**
    * The name of the participant (if any).
    */
    name: string
}

/**
 * Component displaying the avatar for the premeeting screen.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function PremeetingAvatar({ height, name }: Props) {
    const { marginTop, size } = calculateAvatarDimensions(height);

    if (size <= 5) {
        return null;
    }


    return (
        <div style = {{ marginTop }}>
            <Avatar
                className = 'preview-avatar'
                displayName = { name }
                participantId = 'local'
                size = { size } />
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {{
 *    height: number
 * }}
 */
function mapStateToProps(state) {
    return {
        height: state['features/base/responsive-ui'].clientHeight
    };
}

export default connect(mapStateToProps)(PremeetingAvatar);
