/* @flow */

import React from 'react';

import { Tooltip } from '../../../base/tooltip';
import AbstractToolbarButton from '../../../toolbox/components/AbstractToolbarButton';
import type { Props as AbstractToolbarButtonProps } from '../../../toolbox/components/AbstractToolbarButton';

/**
 * The type of the React {@code Component} props of {@link ReactionButton}.
 */
type Props = AbstractToolbarButtonProps & {

    /**
     * Optional text to display in the tooltip.
     */
    tooltip?: string,

    /**
     * From which direction the tooltip should appear, relative to the
     * button.
     */
    tooltipPosition: string,

    /**
     * Optional label for the button.
     */
    label?: string
};

/**
 * The type of the React {@code Component} state of {@link ReactionButton}.
 */
type State = {

    /**
     * Used to determine zoom level on reaction burst.
     */
    increaseLevel: number,

    /**
     * Timeout ID to reset reaction burst.
     */
    increaseTimeout: TimeoutID | null
}

/**
 * Represents a button in the reactions menu.
 *
 * @augments AbstractToolbarButton
 */
class ReactionButton extends AbstractToolbarButton<Props, State> {
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
    constructor(props: Props) {
        super(props);

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onClickHandler = this._onClickHandler.bind(this);

        this.state = {
            increaseLevel: 0,
            increaseTimeout: null
        };
    }

    _onKeyDown: (Object) => void;

    _onClickHandler: () => void;

    /**
     * Handles 'Enter' key on the button to trigger onClick for accessibility.
     * We should be handling Space onKeyUp but it conflicts with PTT.
     *
     * @param {Object} event - The key event.
     * @private
     * @returns {void}
     */
    _onKeyDown(event) {
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
     * @returns {void}
     */
    _onClickHandler() {
        this.props.onClick();
        clearTimeout(this.state.increaseTimeout);
        const timeout = setTimeout(() => {
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
    _renderButton(children) {
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
}

export default ReactionButton;
