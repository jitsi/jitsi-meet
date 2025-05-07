import {
    CreateCallResponse,
    JoinCallPayload,
    JoinCallResponse,
    UsersInCallResponse,
} from "@internxt/sdk/dist/meet/types";
import { SdkManager } from "./sdk-manager.service";

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
     * Creates a new call and returns its details
     * @returns The call details with ID and other properties
     * @async
     **/
    public createCall = async (): Promise<CreateCallResponse> => {
        const meetClient = SdkManager.instance.getMeet();
        return await meetClient.createCall();
    };

    /**
     * Joins an existing call by its ID
     * @param callId The ID of the call to join
     * @param payload The join call payload (name, lastname, anonymous)
     * @returns The join call response with session details
     * @async
     **/
    public joinCall = async (callId: string, payload: JoinCallPayload): Promise<JoinCallResponse> => {
        const meetClient = SdkManager.instance.getMeet();
        return await meetClient.joinCall(callId, payload);
    };

    public leaveCall = async (callId: string): Promise<any> => {
        const meetClient = SdkManager.instance.getMeet();
        return await meetClient.leaveCall(callId);
    };

    /**
     * Gets the list of current users in a call
     * @param callId The ID of the call to get users from
     * @returns Array of users currently in the call
     * @async
     **/
    public getCurrentUsersInCall = async (callId: string): Promise<UsersInCallResponse[]> => {
        const meetClient = SdkManager.instance.getMeet();
        return await meetClient.getCurrentUsersInCall(callId);
    };
}

export default MeetingService;
