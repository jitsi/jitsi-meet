import React, { Component } from 'react';

import Tooltip from '../../../base/tooltip/components/Tooltip';
import { TOOLTIP_POSITION } from '../../../base/ui/constants.any';

/**
 * The type of the React {@code Component} props of {@link ReactionButton}.
 */
interface IProps {

    /**
     * A succinct description of what the button does. Used by accessibility
     * tools and torture tests.
     */
    accessibilityLabel: string;

    /**
     * The Icon of this {@code AbstractToolbarButton}.
     */
    icon: Object;

    /**
     * The style of the Icon of this {@code AbstractToolbarButton}.
     */
    iconStyle?: Object;

    /**
     * Optional label for the button.
     */
    label?: string;

    /**
     * On click handler.
     */
    onClick: Function;

    /**
     * {@code AbstractToolbarButton} Styles.
     */
    style?: Array<string> | Object;

    /**
     * An optional modifier to render the button toggled.
     */
    toggled?: boolean;

    /**
     * Optional text to display in the tooltip.
     */
    tooltip?: string;

    /**
     * From which direction the tooltip should appear, relative to the
     * button.
     */
    tooltipPosition: TOOLTIP_POSITION;

    /**
     * The color underlying the button.
     */
    underlayColor?: any;
}

/**
 * The type of the React {@code Component} state of {@link ReactionButton}.
 */
interface IState {

    /**
     * Used to determine zoom level on reaction burst.
     */
    increaseLevel: number;

    /**
     * Timeout ID to reset reaction burst.
     */
    increaseTimeout: number | null;
}

/**
 * Represents a button in the reactions menu.
 *
 * @augments AbstractToolbarButton
 */
class ReactionButton extends Component<IProps, IState> {
    /**
     * Default values for {@code ReactionButton} component's properties.
     *
     * @static
     */
    static defaultProps = {
        tooltipPosition: 'top'
    };

    /**
     * Initializes a new {@code ReactionButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onClickHandler = this._onClickHandler.bind(this);
        this._onClick = this._onClick.bind(this);

        this.state = {
            increaseLevel: 0,
            increaseTimeout: null
        };
    }

    /**
     * Handles clicking/pressing this {@code AbstractToolbarButton} by
     * forwarding the event to the {@code onClick} prop of this instance if any.
     *
     * @protected
     * @returns {*} The result returned by the invocation of the {@code onClick}
     * prop of this instance if any.
     */
    _onClick(...args: any) {
        const { onClick } = this.props;

        return onClick?.(...args);
    }

    /**
     * Handles 'Enter' key on the button to trigger onClick for accessibility.
     * We should be handling Space onKeyUp but it conflicts with PTT.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyDown(event: React.KeyboardEvent) {
        // If the event coming to the dialog has been subject to preventDefault
        // we don't handle it here.
        if (event.defaultPrevented) {
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            this.props.onClick();
        }
    }

    /**
     * Handles reaction button click.
     *
     * @param {Event} event - The click event.
     * @returns {void}
     */
    _onClickHandler(event: any) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onClick();
        clearTimeout(this.state.increaseTimeout ?? 0);
        const timeout = window.setTimeout(() => {
            this.setState({
                increaseLevel: 0
            });
        }, 500);

        this.setState(state => {
            return {
                increaseLevel: state.increaseLevel + 1,
                increaseTimeout: timeout
            };
        });
    }

    /**
     * Renders the button of this {@code ReactionButton}.
     *
     * @param {Object} children - The children, if any, to be rendered inside
     * the button. Presumably, contains the emoji of this {@code ReactionButton}.
     * @protected
     * @returns {ReactElement} The button of this {@code ReactionButton}.
     */
    _renderButton(children: React.ReactElement) {
        return (
            <div
                aria-label = { this.props.accessibilityLabel }
                aria-pressed = { this.props.toggled }
                className = 'toolbox-button'
                onClick = { this._onClickHandler }
                onKeyDown = { this._onKeyDown }
                role = 'button'
                tabIndex = { 0 }>
                { this.props.tooltip
                    ? <Tooltip
                        content = { this.props.tooltip }
                        position = { this.props.tooltipPosition }>
                        { children }
                    </Tooltip>
                    : children }
            </div>
        );
    }

    /**
     * Renders the icon (emoji) of this {@code reactionButton}.
     *
     * @inheritdoc
     */
    _renderIcon() {
        const { toggled, icon, label } = this.props;
        const { increaseLevel } = this.state;

        return (
            <div className = { `toolbox-icon ${toggled ? 'toggled' : ''}` }>
                <span className = { `emoji increase-${increaseLevel > 12 ? 12 : increaseLevel}` }>{icon}</span>
                {label && <span className = 'text'>{label}</span>}
            </div>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this._renderButton(this._renderIcon());
    }
}

export default ReactionButton;
