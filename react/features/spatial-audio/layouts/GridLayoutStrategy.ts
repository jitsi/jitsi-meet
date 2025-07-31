import { ILayoutStrategy, ISpatialPosition } from '../types';

/**
 * Grid-based layout strategy that arranges participants in rows
 * - 1 row (0-4 participants): elevation = 0
 * - 2 rows (5-8 participants): upper row = +1, lower row = -1  
 * - 3 rows (9-12 participants): upper row = +1.5, middle row = 0, lower row = -1.5
 * - Fallback for >12 participants: horizontal line at elevation = 0
 */
export class GridLayoutStrategy implements ILayoutStrategy {
    calculatePositions(participantCount: number): ISpatialPosition[] {
        const positions: ISpatialPosition[] = [];
        
        for (let index = 0; index < participantCount; index++) {
            positions.push(this.getPositionForIndex(index, participantCount));
        }
        
        return positions;
    }
    
    getPositionForIndex(index: number, totalCount: number): ISpatialPosition {
        let xPos = 0;
        let yPos = 0; // yPos represents elevation (vertical positioning)
        
        if (totalCount <= 4) {
            // Single row layout (0-4 participants)
            if (totalCount > 1) {
                xPos = ((index / (totalCount - 1)) * 4) - 2; // Range: -2 to +2
            }
            yPos = 0; // No elevation
            
        } else if (totalCount <= 8) {
            // Two row layout (5-8 participants)
            const participantsPerRow = Math.ceil(totalCount / 2);
            const row = Math.floor(index / participantsPerRow);
            const indexInRow = index % participantsPerRow;
            const participantsInThisRow = row === 0 ? participantsPerRow : totalCount - participantsPerRow;
            
            // Calculate horizontal position within the row
            if (participantsInThisRow > 1) {
                xPos = ((indexInRow / (participantsInThisRow - 1)) * 4) - 2; // Range: -2 to +2
            }
            
            // Set elevation: upper row = +1, lower row = -1
            yPos = row === 0 ? 1 : -1;
            
        } else if (totalCount <= 12) {
            // Three row layout (9-12 participants)
            const participantsPerRow = Math.ceil(totalCount / 3);
            const row = Math.floor(index / participantsPerRow);
            const indexInRow = index % participantsPerRow;
            
            // Calculate how many participants are actually in this row
            let participantsInThisRow;
            if (row === 0) {
                participantsInThisRow = Math.min(participantsPerRow, totalCount);
            } else if (row === 1) {
                participantsInThisRow = Math.min(participantsPerRow, totalCount - participantsPerRow);
            } else {
                participantsInThisRow = totalCount - (2 * participantsPerRow);
            }
            
            // Calculate horizontal position within the row
            if (participantsInThisRow > 1) {
                xPos = ((indexInRow / (participantsInThisRow - 1)) * 4) - 2; // Range: -2 to +2
            }
            
            // Set elevation: upper row = +1.5, middle row = 0, lower row = -1.5
            if (row === 0) {
                yPos = 1.5; // Upper row
            } else if (row === 1) {
                yPos = 0;   // Middle row
            } else {
                yPos = -1.5; // Lower row
            }
            
        } else {
            // Fallback for more than 12 participants - use simple horizontal layout
            if (totalCount > 1) {
                xPos = ((index / (totalCount - 1)) * 4) - 2;
            }
            yPos = 0;
        }
        
        return { x: xPos, y: yPos, z: 0 };
    }
} 