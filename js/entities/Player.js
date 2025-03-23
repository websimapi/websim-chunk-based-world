import * as THREE from 'three';
import { CONFIG } from '../../config.js';

export class Player {
    constructor(camera, controls, playerData = null) {
        this.camera = camera;
        this.controls = controls;
        
        // Set up player position
        this.position = new THREE.Vector3();
        
        // Load player data if available, or use default spawn
        if (playerData) {
            this.position.set(playerData.position.x, playerData.position.y, playerData.position.z);
        } else {
            this.position.set(
                CONFIG.DEFAULT_SPAWN.x,
                CONFIG.DEFAULT_SPAWN.y, 
                CONFIG.DEFAULT_SPAWN.z
            );
        }
        
        // Update camera position
        this.updateCameraPosition();
        
        // Set up controls
        this.setupControls();
        
        // Movement parameters
        this.moveSpeed = CONFIG.PLAYER_MOVE_SPEED;
        this.moveDirection = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
    }
    
    setupControls() {
        // Set up keyboard controls
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.up = true;
                break;
            case 'ShiftLeft':
            case 'KeyC':
                this.keys.down = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.up = false;
                break;
            case 'ShiftLeft':
            case 'KeyC':
                this.keys.down = false;
                break;
        }
    }
    
    update() {
        this.updateMovement();
        this.updateCameraPosition();
    }
    
    updateMovement() {
        // Calculate time since last frame for smooth movement
        const delta = 1/60; // Assuming 60fps, could use actual delta time
        
        // Reset movement direction
        this.moveDirection.set(0, 0, 0);
        
        // Apply movement based on keys
        if (this.keys.forward) this.moveDirection.z -= 1;
        if (this.keys.backward) this.moveDirection.z += 1;
        if (this.keys.left) this.moveDirection.x -= 1;
        if (this.keys.right) this.moveDirection.x += 1;
        if (this.keys.up) this.moveDirection.y += 1;
        if (this.keys.down) this.moveDirection.y -= 1;
        
        // Normalize movement direction if we're moving
        if (this.moveDirection.lengthSq() > 0) {
            this.moveDirection.normalize();
        }
        
        // Apply camera rotation to movement
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(this.camera.matrix);
        this.moveDirection.applyMatrix4(rotationMatrix);
        
        // Update position
        this.position.x += this.moveDirection.x * this.moveSpeed * delta;
        this.position.y += this.moveDirection.y * this.moveSpeed * delta;
        this.position.z += this.moveDirection.z * this.moveSpeed * delta;
    }
    
    updateCameraPosition() {
        this.camera.position.copy(this.position);
        this.camera.position.y += CONFIG.PLAYER_HEIGHT; // Eye height
        this.controls.target.copy(this.position);
        this.controls.update();
    }
}

