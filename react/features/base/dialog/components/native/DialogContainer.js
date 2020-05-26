import { connect } from '../../../redux';
import AbstractDialogContainer, {
    abstractMapStateToProps
} from '../AbstractDialogContainer';

/**
 * Implements a DialogContainer responsible for showing all dialogs. We will
 * need a separate container so we can handle multiple dialogs by showing them
 * simultaneously or queueing them.
 *
 * @extends AbstractDialogContainer
 */
class DialogContainer extends AbstractDialogContainer {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return this._renderDialogContent();
    }
}

export default connect(abstractMapStateToProps)(DialogContainer);
