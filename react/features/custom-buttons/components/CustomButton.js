import Button from '@atlaskit/button';
import React from 'react';

/**
 * Custom button which opens specified url.
 *
 * @augments Component
 */
export class CustomButton extends React.PureComponent {

    /**
     * Instantiates a new {@code CustomButton}.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Handler opens the button's url.
     *
     * @returns {void}
     */
    _onClick() {
        window.open(this.props.url, '_blank');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Button
                { ...this.props }
                onClick = { this._onClick }>
                { this.props.text }
            </Button>
        );
    }
}

