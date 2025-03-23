export const CONFIG = {
    // World generation
    CHUNK_SIZE: 16,            // Size of each chunk in world units
    RENDER_DISTANCE: 3,        // Number of chunks to render in each direction
    DEFAULT_TERRAIN_HEIGHT: 0, // Default height for flat terrain
    
    // Database
    WORLD_COLLECTION: "world_data_v1", // Collection for all world data per user
    
    // Player settings
    PLAYER_MOVE_SPEED: 10,     // Units per second
    PLAYER_HEIGHT: 1.8,        // Height of player camera
    DEFAULT_SPAWN: { x: 0, y: 5, z: 0 } // Default spawn position for new players
};