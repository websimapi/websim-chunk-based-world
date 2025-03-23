import { CONFIG } from '../../config.js';

export class DatabaseManager {
    constructor(room) {
        this.room = room;
        this.chunkCollection = `${CONFIG.COLLECTION_PREFIX}_chunks`;
        this.playerCollection = CONFIG.PLAYER_COLLECTION;
    }
    
    /**
     * Load chunk data from the database
     */
    async loadChunkData(chunkX, chunkZ) {
        const chunkKey = `${chunkX}_${chunkZ}`;
        
        try {
            // Try to get the chunk data from the database
            const chunks = this.room.collection(this.chunkCollection)
                .filter({ key: chunkKey })
                .getList();
                
            if (chunks && chunks.length > 0) {
                return chunks[0].data;
            }
            
            // Return null if no chunk data found
            return null;
        } catch (error) {
            console.error('Error loading chunk data:', error);
            return null;
        }
    }
    
    /**
     * Save chunk data to the database
     */
    async saveChunkData(chunkX, chunkZ, chunkData) {
        const chunkKey = `${chunkX}_${chunkZ}`;
        
        try {
            // Check if the chunk already exists
            const existingChunks = this.room.collection(this.chunkCollection)
                .filter({ key: chunkKey })
                .getList();
                
            if (existingChunks && existingChunks.length > 0) {
                // Update existing chunk
                await this.room.collection(this.chunkCollection)
                    .update(existingChunks[0].id, { data: chunkData });
            } else {
                // Create new chunk
                await this.room.collection(this.chunkCollection)
                    .create({ key: chunkKey, data: chunkData });
            }
            
            return true;
        } catch (error) {
            console.error('Error saving chunk data:', error);
            return false;
        }
    }
    
    /**
     * Load player data from the database
     */
    async loadPlayerData() {
        try {
            const clientId = this.room.party.client.id;
            
            // Try to get the player data from the database
            const playerDataList = this.room.collection(this.playerCollection)
                .filter({ clientId: clientId })
                .getList();
                
            if (playerDataList && playerDataList.length > 0) {
                return playerDataList[0].data;
            }
            
            // Create a new player entry if none exists
            const defaultPlayerData = {
                position: CONFIG.DEFAULT_SPAWN,
                lastSeen: new Date().toISOString()
            };
            
            await this.room.collection(this.playerCollection)
                .create({ clientId, data: defaultPlayerData });
                
            return defaultPlayerData;
            
        } catch (error) {
            console.error('Error loading player data:', error);
            // Return default spawn data if something went wrong
            return { position: CONFIG.DEFAULT_SPAWN };
        }
    }
    
    /**
     * Save player position to the database
     */
    async savePlayerPosition(position) {
        try {
            const clientId = this.room.party.client.id;
            
            // Get current player data
            const playerDataList = this.room.collection(this.playerCollection)
                .filter({ clientId: clientId })
                .getList();
                
            if (playerDataList && playerDataList.length > 0) {
                const playerData = {
                    ...playerDataList[0].data,
                    position: {
                        x: position.x,
                        y: position.y,
                        z: position.z
                    },
                    lastSeen: new Date().toISOString()
                };
                
                // Update player data
                await this.room.collection(this.playerCollection)
                    .update(playerDataList[0].id, { data: playerData });
            } else {
                // Create new player data if it doesn't exist
                const playerData = {
                    position: {
                        x: position.x,
                        y: position.y,
                        z: position.z
                    },
                    lastSeen: new Date().toISOString()
                };
                
                await this.room.collection(this.playerCollection)
                    .create({ clientId, data: playerData });
            }
            
            return true;
        } catch (error) {
            console.error('Error saving player position:', error);
            return false;
        }
    }
    
    /**
     * Load all nearby chunks for initial world loading
     */
    async loadAllNearbyChunks(centerX, centerZ, radius) {
        try {
            const allChunks = this.room.collection(this.chunkCollection).getList();
            
            // Filter chunks that are within the radius of the player
            return allChunks.filter(chunk => {
                const [chunkX, chunkZ] = chunk.key.split('_').map(Number);
                const distance = Math.max(
                    Math.abs(chunkX - centerX),
                    Math.abs(chunkZ - centerZ)
                );
                return distance <= radius;
            });
            
        } catch (error) {
            console.error('Error loading nearby chunks:', error);
            return [];
        }
    }
}

