// @flow

import React from 'react';

import { connect } from '../../base/redux';

import { CustomButton } from './CustomButton';

/**
 * The type of the React {@code Component} props of {@link CustomButtons}.
 */
type Props = {

    /**
     * List of buttons to be displayed as specified in config.js.
     */
    _buttons: Array<Object>,

    /**
     * Flag signaling if the buttons are rendered on the conference screen.
     */
    onConference: boolean,

    /**
     * Flag signaling if the buttons are rendered on the prejoin screen.
     */
    onPrejoin: boolean
}


/**
 * Implements customizable buttons with static links.
 *
 * @extends Component
 */
class CustomButtonContainer extends React.PureComponent<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {

        const containerClassName = `custom-button-container
            ${this.props.onConference ? 'custom-button-on-conference' : ''}
            ${this.props.onPrejoin ? 'custom-button-on-prejoin' : ''}`;
        const buttons = [];

        for (const button of this.props._buttons) {
            buttons.push(
                <CustomButton
                    className = 'custom-button'
                    key = { `custom-button${button.text}` }
                    text = { button.text }
                    url = { button.url } />
            );
        }

        return (
            <div className = { containerClassName } >
                { buttons }
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Props) {

    const { customButtons } = state['features/base/config'];
    const { onConference, onPrejoin } = ownProps;

    return {
        _buttons: customButtons || [],
        onConference: Boolean(onConference),
        onPrejoin: Boolean(onPrejoin)
    };
}
export default connect(_mapStateToProps)(CustomButtonContainer);
