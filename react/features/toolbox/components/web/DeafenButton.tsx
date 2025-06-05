import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

/**
 * Component that renders a toolbar button for toggling deafen.
 *
 * @augments AbstractDeafenButton
 */
class DeafenButton extends AbstractButton<AbstractButtonProps> {
    /**
     * Initializes a new {@code DeafenButton} instance.
     *
     * @param {AbstractButtonProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: AbstractButtonProps) {
        super(props);
        this._getTooltip = this._getLabel;
    }
}

export default DeafenButton;
