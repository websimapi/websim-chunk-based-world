import { CONFIG } from '../../config.js';

export class DatabaseManager {
    constructor(room) {
        this.room = room;
        this.worldCollection = CONFIG.WORLD_COLLECTION;
        this.clientId = room.party.client.id;
        this.worldData = null;
    }
    
    /**
     * Initialize the database and load world data
     */
    async initializeWorldData() {
        try {
            // Try to get the world data from the database
            const worldDataList = this.room.collection(this.worldCollection)
                .filter({ clientId: this.clientId })
                .getList();
                
            if (worldDataList && worldDataList.length > 0) {
                this.worldData = worldDataList[0];
                return this.worldData.data;
            }
            
            // Create a new world entry if none exists
            const defaultWorldData = {
                chunks: {},
                playerPosition: CONFIG.DEFAULT_SPAWN,
                lastSeen: new Date().toISOString()
            };
            
            const createdData = await this.room.collection(this.worldCollection)
                .create({ clientId: this.clientId, data: defaultWorldData });
                
            this.worldData = createdData;
            return defaultWorldData;
            
        } catch (error) {
            console.error('Error initializing world data:', error);
            // Return default data if something went wrong
            return { 
                chunks: {}, 
                playerPosition: CONFIG.DEFAULT_SPAWN 
            };
        }
    }
    
    /**
     * Load chunk data from the database
     */
    async loadChunkData(chunkX, chunkZ) {
        if (!this.worldData) {
            await this.initializeWorldData();
        }
        
        const chunkKey = `${chunkX}_${chunkZ}`;
        
        if (this.worldData.data.chunks && this.worldData.data.chunks[chunkKey]) {
            return this.worldData.data.chunks[chunkKey];
        }
        
        return null;
    }
    
    /**
     * Save chunk data to the database
     */
    async saveChunkData(chunkX, chunkZ, chunkData) {
        if (!this.worldData) {
            await this.initializeWorldData();
        }
        
        const chunkKey = `${chunkX}_${chunkZ}`;
        
        try {
            // Update the local copy of world data
            if (!this.worldData.data.chunks) {
                this.worldData.data.chunks = {};
            }
            
            this.worldData.data.chunks[chunkKey] = chunkData;
            
            // Update the database with the new chunk
            await this.room.collection(this.worldCollection)
                .update(this.worldData.id, { data: this.worldData.data });
                
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
        if (!this.worldData) {
            await this.initializeWorldData();
        }
        
        if (this.worldData.data.playerPosition) {
            return { position: this.worldData.data.playerPosition };
        }
        
        return { position: CONFIG.DEFAULT_SPAWN };
    }
    
    /**
     * Save player position to the database
     */
    async savePlayerPosition(position) {
        if (!this.worldData) {
            await this.initializeWorldData();
        }
        
        try {
            // Update the local copy of world data
            this.worldData.data.playerPosition = {
                x: position.x,
                y: position.y,
                z: position.z
            };
            this.worldData.data.lastSeen = new Date().toISOString();
            
            // Update the database
            await this.room.collection(this.worldCollection)
                .update(this.worldData.id, { data: this.worldData.data });
                
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
        if (!this.worldData) {
            await this.initializeWorldData();
        }
        
        const nearbyChunks = [];
        
        if (this.worldData.data.chunks) {
            for (const chunkKey in this.worldData.data.chunks) {
                const [chunkX, chunkZ] = chunkKey.split('_').map(Number);
                const distance = Math.max(
                    Math.abs(chunkX - centerX),
                    Math.abs(chunkZ - centerZ)
                );
                
                if (distance <= radius) {
                    nearbyChunks.push({
                        key: chunkKey,
                        data: this.worldData.data.chunks[chunkKey]
                    });
                }
            }
        }
        
        return nearbyChunks;
    }
}