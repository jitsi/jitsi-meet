import { get8x8BetaJWT } from "../../connection/options8x8";

class MeetingService {
    private static instance: MeetingService;
    private constructor() {}

    public static getInstance(): MeetingService {
        if (!MeetingService.instance) {
            MeetingService.instance = new MeetingService();
        }
        return MeetingService.instance;
    }

    /**
     * Generates a new meeting room
     * @param token - The JWT authentication token
     * @returns A promise that resolves to the generated roomID
     * @throws {MeetingError} If there's an error generating the meeting room
     */
    public async generateMeetingRoom(token: string): Promise<string | null> {
        const meetData = await get8x8BetaJWT(token);
        return meetData?.room;
    }
}

export default MeetingService;
