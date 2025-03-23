import * as THREE from 'three';
import { CONFIG } from '../../config.js';
import { ChunkGenerator } from './ChunkGenerator.js';

export class WorldManager {
    constructor(scene, dbManager) {
        this.scene = scene;
        this.dbManager = dbManager;
        this.chunkGenerator = new ChunkGenerator();
        
        // Map to store loaded chunks - key is "x,z" string
        this.loadedChunks = new Map();
        
        // Track the last center chunk coordinates for updates
        this.lastCenterChunkX = null;
        this.lastCenterChunkZ = null;
    }
    
    /**
     * Gets the chunk key for a given chunk coordinate
     */
    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }
    
    /**
     * Gets the chunk coordinates for a world position
     */
    getChunkCoordsFromPosition(position) {
        const chunkX = Math.floor(position.x / CONFIG.CHUNK_SIZE);
        const chunkZ = Math.floor(position.z / CONFIG.CHUNK_SIZE);
        return { chunkX, chunkZ };
    }
    
    /**
     * Updates the world based on player position, loading and unloading chunks as needed
     */
    update(playerPosition) {
        const { chunkX, chunkZ } = this.getChunkCoordsFromPosition(playerPosition);
        
        // Only update chunks if player moved to a different chunk
        if (chunkX !== this.lastCenterChunkX || chunkZ !== this.lastCenterChunkZ) {
            this.loadChunksAroundPlayer(playerPosition);
            this.lastCenterChunkX = chunkX;
            this.lastCenterChunkZ = chunkZ;
        }
    }
    
    /**
     * Load chunks around the player's position
     */
    async loadChunksAroundPlayer(playerPosition) {
        const { chunkX, chunkZ } = this.getChunkCoordsFromPosition(playerPosition);
        const renderDistance = CONFIG.RENDER_DISTANCE;
        
        // Determine which chunks should be loaded
        const chunksToLoad = new Set();
        for (let x = chunkX - renderDistance; x <= chunkX + renderDistance; x++) {
            for (let z = chunkZ - renderDistance; z <= chunkZ + renderDistance; z++) {
                chunksToLoad.add(this.getChunkKey(x, z));
            }
        }
        
        // Unload chunks that are now too far away
        for (const [key, chunk] of this.loadedChunks.entries()) {
            if (!chunksToLoad.has(key)) {
                // Remove from scene
                this.scene.remove(chunk.mesh);
                // Save chunk data before unloading
                await this.dbManager.saveChunkData(chunk.chunkX, chunk.chunkZ, chunk.data);
                // Delete from loaded chunks
                this.loadedChunks.delete(key);
            }
        }
        
        // Load new chunks
        for (const chunkKey of chunksToLoad) {
            if (!this.loadedChunks.has(chunkKey)) {
                const [x, z] = chunkKey.split(',').map(Number);
                await this.loadChunk(x, z);
            }
        }
    }
    
    /**
     * Load or generate a specific chunk
     */
    async loadChunk(chunkX, chunkZ) {
        const chunkKey = this.getChunkKey(chunkX, chunkZ);
        
        // Check if already loaded
        if (this.loadedChunks.has(chunkKey)) {
            return;
        }
        
        // Try to load from database
        let chunkData = await this.dbManager.loadChunkData(chunkX, chunkZ);
        
        // Generate new chunk if it doesn't exist in the database
        if (!chunkData) {
            chunkData = this.chunkGenerator.generateChunk(chunkX, chunkZ);
            // Save the newly generated chunk to database
            await this.dbManager.saveChunkData(chunkX, chunkZ, chunkData);
        }
        
        // Create the chunk mesh and add to scene
        const chunk = this.createChunkMesh(chunkX, chunkZ, chunkData);
        this.scene.add(chunk.mesh);
        
        // Store in loaded chunks map
        this.loadedChunks.set(chunkKey, chunk);
    }
    
    /**
     * Create a visual mesh for a chunk based on its data
     */
    createChunkMesh(chunkX, chunkZ, chunkData) {
        const geometry = new THREE.PlaneGeometry(CONFIG.CHUNK_SIZE, CONFIG.CHUNK_SIZE, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x7CFC00, // Light green for grass
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        
        // Position the chunk correctly in world space
        mesh.position.set(
            chunkX * CONFIG.CHUNK_SIZE + CONFIG.CHUNK_SIZE / 2,
            0, // Height at y=0 for flat terrain
            chunkZ * CONFIG.CHUNK_SIZE + CONFIG.CHUNK_SIZE / 2
        );
        
        return {
            mesh,
            chunkX,
            chunkZ,
            data: chunkData
        };
    }
}

