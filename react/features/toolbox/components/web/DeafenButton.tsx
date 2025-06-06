import { connect } from 'react-redux';
import AbstractDeafenButton, {
    IProps as AbstractDeafenButtonProps,
    mapStateToProps as abstractMapStateToProps
} from '../AbstractDeafenButton';
import { translate } from '../../../base/i18n/functions';

/**
 * The type of the React {@code Component} props of {@link DeafenButton}.
 */
interface IProps extends AbstractDeafenButtonProps {
    /**
     * Whether the deafen action is pending.
     */
    _pending?: boolean;
}

/**
 * Component that renders a toolbar button for toggling deafen.
 *
 * @augments AbstractDeafenButton
 */
class DeafenButton extends AbstractDeafenButton<IProps> {
    /**
     * Initializes a new {@code DeafenButton} instance.
     *
     * @param {AbstractButtonProps} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);
        this._getTooltip = this._getLabel;
    }
}

export default translate(connect(abstractMapStateToProps)(DeafenButton));
