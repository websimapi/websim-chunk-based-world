import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';
import { WorldManager } from './world/WorldManager.js';
import { Player } from './entities/Player.js';
import { DatabaseManager } from './data/DatabaseManager.js';

class Game {
    constructor() {
        this.room = new WebsimSocket();
        this.setupThree();
        this.init();
    }

    setupThree() {
        // Set up Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue color
        
        // Add basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Add controls for development
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    async init() {
        // Initialize database manager
        this.dbManager = new DatabaseManager(this.room);
        
        // Initialize world data
        await this.dbManager.initializeWorldData();
        
        // Initialize world manager with database manager
        this.worldManager = new WorldManager(this.scene, this.dbManager);
        
        // Load player data
        const playerData = await this.dbManager.loadPlayerData();
        
        // Initialize player
        this.player = new Player(this.camera, this.controls, playerData);
        
        // Add player to scene
        this.worldManager.loadChunksAroundPlayer(this.player.position);
        
        // Start game loop
        this.animate();
        
        // Set up player position update interval
        setInterval(() => this.dbManager.savePlayerPosition(this.player.position), 5000);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updateUI() {
        // Update position display
        const pos = this.player.position;
        document.getElementById('coords-display').textContent = 
            `Position: X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
        
        // Update chunk info
        const chunkX = Math.floor(pos.x / CONFIG.CHUNK_SIZE);
        const chunkZ = Math.floor(pos.z / CONFIG.CHUNK_SIZE);
        document.getElementById('chunk-info').textContent = 
            `Current Chunk: ${chunkX},${chunkZ}`;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update player
        this.player.update();
        
        // Check if we need to load/unload chunks
        this.worldManager.update(this.player.position);
        
        // Update UI
        this.updateUI();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
});