// @flow

import React, { Component } from 'react';
import { Icon } from '../../icons';

type Props = {

    /**
     * The decorated component (ToolboxButton).
     */
    children: React$Node,

    /**
     * Icon of the button.
     */
    icon: Function,

    /**
     * Flag used for disabling the small icon.
     */
    iconDisabled: boolean,

    /**
     * Click handler for the small icon.
     */
    onIconClick: Function,

    /**
     * Additional styles.
     */
    styles?: Object,
};

type State = {

    /**
     * Whether the button is hovered or not.
     */
    isHovered: boolean,
};

/**
 * Displayes the `ToolboxButtonWithIcon` component.
 *
 * @returns {ReactElement}
 */
export default class ToolboxButtonWithIcon extends Component<Props, State> {

    /**
     * Initializes a new {@code ToolboxButtonWithIcon} instance.
     *
     * @param {Props} props - The props of the component.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            isHovered: false
        };
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
    }

    _onMouseEnter: () => void;

    /**
     * Handler for when the small button has the mouse over.
     *
     * @returns {void}.
     */
    _onMouseEnter() {
        this.setState({
            isHovered: true
        });
    }

    _onMouseLeave: () => void;

    /**
     * Handler for when the mouse leaves the small button.
     *
     * @returns {void}
     */
    _onMouseLeave() {
        this.setState({
            isHovered: false
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render() {
        const {
            children,
            icon,
            iconDisabled,
            onIconClick,
            styles
        } = this.props;

        const iconProps = {};
        let size = 9;

        if (iconDisabled) {
            iconProps.className
                = 'settings-button-small-icon settings-button-small-icon--disabled';
        } else {
            iconProps.className = 'settings-button-small-icon';
            iconProps.onClick = onIconClick;

            if (this.state.isHovered) {
                iconProps.className = `${iconProps.className} settings-button-small-icon--hovered`;
                size = 11;
            }
        }

        return (
            <div
                className = 'settings-button-container'
                styles = { styles }>
                {children}
                <div
                    onMouseEnter = { this._onMouseEnter }
                    onMouseLeave = { this._onMouseLeave }>
                    <Icon
                        { ...iconProps }
                        size = { size }
                        src = { icon } />
                </div>
            </div>
        );
    }
}
