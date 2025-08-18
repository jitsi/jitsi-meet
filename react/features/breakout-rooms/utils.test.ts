import { Participants } from './utils';
import { IRoom, IParticipant } from './types';

describe('Participants utility functions', () => {
    let mockRoom: IRoom;
    let mockParticipants: Map<string, IParticipant>;

    beforeEach(() => {
        mockParticipants = new Map([
            ['user1@example.com', {
                displayName: 'User 1',
                jid: 'user1@example.com',
                role: 'moderator'
            }],
            ['user2@example.com', {
                displayName: 'User 2',
                jid: 'user2@example.com',
                role: 'participant'
            }]
        ]);

        mockRoom = {
            id: 'room1',
            jid: 'room1@example.com',
            name: 'Test Room',
            participants: mockParticipants
        };
    });

    describe('keys', () => {
        it('should return all participant keys', () => {
            const keys = Participants.keys(mockRoom);
            expect(keys).toEqual(['user1@example.com', 'user2@example.com']);
        });
    });

    describe('values', () => {
        it('should return all participant values', () => {
            const values = Participants.values(mockRoom);
            expect(values).toHaveLength(2);
            expect(values[0].displayName).toBe('User 1');
            expect(values[1].displayName).toBe('User 2');
        });
    });

    describe('entries', () => {
        it('should return all participant entries', () => {
            const entries = Participants.entries(mockRoom);
            expect(entries).toHaveLength(2);
            expect(entries[0][0]).toBe('user1@example.com');
            expect(entries[0][1].displayName).toBe('User 1');
        });
    });

    describe('count', () => {
        it('should return the correct participant count', () => {
            const count = Participants.count(mockRoom);
            expect(count).toBe(2);
        });
    });

    describe('isEmpty', () => {
        it('should return false for non-empty room', () => {
            const isEmpty = Participants.isEmpty(mockRoom);
            expect(isEmpty).toBe(false);
        });

        it('should return true for empty room', () => {
            const emptyRoom: IRoom = {
                ...mockRoom,
                participants: new Map()
            };
            const isEmpty = Participants.isEmpty(emptyRoom);
            expect(isEmpty).toBe(true);
        });
    });

    describe('findByJid', () => {
        it('should find participant by exact JID', () => {
            const participant = Participants.findByJid(mockRoom, 'user1@example.com');
            expect(participant?.displayName).toBe('User 1');
        });

        it('should return undefined for non-existent JID', () => {
            const participant = Participants.findByJid(mockRoom, 'nonexistent@example.com');
            expect(participant).toBeUndefined();
        });
    });

    describe('findByPartialJid', () => {
        it('should find participant by partial JID', () => {
            const participant = Participants.findByPartialJid(mockRoom, 'user1');
            expect(participant?.displayName).toBe('User 1');
        });

        it('should return undefined for non-existent partial JID', () => {
            const participant = Participants.findByPartialJid(mockRoom, 'nonexistent');
            expect(participant).toBeUndefined();
        });
    });

    describe('findById', () => {
        it('should find participant by ID extracted from JID', () => {
            const participant = Participants.findById(mockRoom, 'user1');
            expect(participant?.displayName).toBe('User 1');
        });

        it('should return undefined for non-existent ID', () => {
            const participant = Participants.findById(mockRoom, 'nonexistent');
            expect(participant).toBeUndefined();
        });
    });

    describe('toJSON and fromJSON', () => {
        it('should convert Map to JSON and back correctly', () => {
            const json = Participants.toJSON(mockRoom);
            expect(json).toEqual({
                'user1@example.com': {
                    displayName: 'User 1',
                    jid: 'user1@example.com',
                    role: 'moderator'
                },
                'user2@example.com': {
                    displayName: 'User 2',
                    jid: 'user2@example.com',
                    role: 'participant'
                }
            });

            const map = Participants.fromJSON(json);
            expect(map.size).toBe(2);
            expect(map.get('user1@example.com')?.displayName).toBe('User 1');
        });
    });
});
