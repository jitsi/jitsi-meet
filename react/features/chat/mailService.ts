import { IParticipant } from "../base/participants/types";
import { JITSI_MAIL } from "./constants";
import { JITSI_MAIL_PASSWORD } from "./constants";

interface ItransporterBody {
    service: string,
    auth: {
        user: string,
        pass: string
    }
}

interface ImailOptionBody {
    from: string,
    to: string | undefined,
    subject: string,
    text: string
}

class MailService {
    getMailComponents(messageOwner: IParticipant, localParticipant: IParticipant, message: string, moderator: IParticipant) {
        let text = `Dear ${moderator.name},\n\nI would like to bring to your attention an incident that occurred during the recent meeting on ${Date()}. 
        Unfortunately, there was an instance where abusive or disrespectful language was used by ${messageOwner.name}, which I believe is against the expected conduct for such meetings.
    
        The specific words used were: ${message}. 
        This kind of behavior is inappropriate and detracts from the professionalism and respect that should be maintained in our discussions.
    
        I hope that you can address this matter accordingly, to ensure a more respectful and positive environment for future meetings.
    
        Thank you for your attention to this matter.\n\nBest regards,\n ${localParticipant.name}`

        let mailOption: ImailOptionBody = {
            from: JITSI_MAIL,
            to: moderator.email,
            subject: 'Report of Disrespectful Behavior in Recent Meeting',
            text: text
        }

        let transporter: ItransporterBody = {
            service: "gmail",
            auth: {
                user: JITSI_MAIL,
                pass: JITSI_MAIL_PASSWORD
            }
        }

        return {mailOption,transporter};
    }
}

export default new MailService();
