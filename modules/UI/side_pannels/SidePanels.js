import Chat from './chat/Chat';
import SettingsMenu from './settings/SettingsMenu';
import Profile from './profile/Profile';
import ContactListView from './contactlist/ContactListView';

const SidePanels = {
    init (eventEmitter) {
        //Initialize chat
        Chat.init(eventEmitter);
        //Initialize settings
        SettingsMenu.init(eventEmitter);
        //Initialize profile
        Profile.init(eventEmitter);
        //Initialize contact list view
        ContactListView.init();
    }
};

export default SidePanels;