import Chat from './chat/Chat';
import { isButtonEnabled } from '../../../react/features/toolbox';

const SidePanels = {
    init(eventEmitter) {
        // Initialize chat
        if (isButtonEnabled('chat')) {
            Chat.init(eventEmitter);
        }
    }
};

export default SidePanels;
