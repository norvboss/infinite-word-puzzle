class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = null;
        this.playerId = null;
        this.worldState = null;
        this.selectedBuilding = null;
        this.tileSize = 32;
        this.camera = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        this.gridSize = 50;

        this.buildingColors = {
            house: '#8B4513',
            farm: '#228B22',
            tower: '#4A4A4A'
        };

        this.setupCanvas();
        this.setupWebSocket();
        this.setupEventListeners();
        this.startGameLoop();
    }

    setupCanvas() {
        const updateCanvasSize = () => {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            this.showStatus('Connected to server');
        };

        this.socket.onclose = () => {
            this.showStatus('Disconnected from server');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
    }

    setupEventListeners() {
        // Mouse move handler
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        // Mouse click handler
        this.canvas.addEventListener('click', (e) => {
            if (this.selectedBuilding) {
                const gridPos = this.screenToGrid(this.mousePos.x, this.mousePos.y);
                this.placeBuilding(this.selectedBuilding, gridPos);
            }
        });

        // Building selection
        document.querySelectorAll('.building-option').forEach(option => {
            option.addEventListener('click', () => {
                const buildingType = option.dataset.building;
                this.selectedBuilding = buildingType;
                this.showStatus(`Selected ${buildingType}`);
            });
        });

        // Camera movement with arrow keys
        window.addEventListener('keydown', (e) => {
            const moveSpeed = 10;
            switch (e.key) {
                case 'ArrowLeft':
                    this.camera.x -= moveSpeed;
                    break;
                case 'ArrowRight':
                    this.camera.x += moveSpeed;
                    break;
                case 'ArrowUp':
                    this.camera.y -= moveSpeed;
                    break;
                case 'ArrowDown':
                    this.camera.y += moveSpeed;
                    break;
            }
        });
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'init':
                this.playerId = data.playerId;
                this.worldState = data.world;
                this.updateResourceDisplay();
                break;

            case 'building_placed':
                this.worldState.buildings.push(data.building);
                if (data.building.ownerId === this.playerId) {
                    this.updateResourceDisplay();
                }
                break;

            case 'player_joined':
                this.worldState.players[data.player.id] = data.player;
                this.showStatus(`Player joined: ${data.player.id}`);
                break;

            case 'player_left':
                delete this.worldState.players[data.playerId];
                this.showStatus(`Player left: ${data.playerId}`);
                break;

            case 'player_moved':
                if (this.worldState.players[data.playerId]) {
                    this.worldState.players[data.playerId].position = data.position;
                }
                break;
        }
    }

    placeBuilding(type, position) {
        if (!this.worldState || !this.playerId) return;

        this.socket.send(JSON.stringify({
            action: 'place_building',
            building: { type },
            position
        }));
    }

    updateResourceDisplay() {
        if (!this.worldState || !this.playerId) return;
        
        const player = this.worldState.players[this.playerId];
        if (!player) return;

        document.getElementById('gold-amount').textContent = player.resources.gold;
        document.getElementById('wood-amount').textContent = player.resources.wood;
        document.getElementById('stone-amount').textContent = player.resources.stone;
    }

    showStatus(message) {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }

    screenToGrid(screenX, screenY) {
        return {
            x: Math.floor((screenX + this.camera.x) / this.tileSize),
            y: Math.floor((screenY + this.camera.y) / this.tileSize)
        };
    }

    gridToScreen(gridX, gridY) {
        return {
            x: gridX * this.tileSize - this.camera.x,
            y: gridY * this.tileSize - this.camera.y
        };
    }

    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        const startX = Math.floor(this.camera.x / this.tileSize) * this.tileSize - this.camera.x;
        const startY = Math.floor(this.camera.y / this.tileSize) * this.tileSize - this.camera.y;

        for (let x = startX; x < this.canvas.width; x += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < this.canvas.height; y += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawBuildings() {
        if (!this.worldState) return;

        this.worldState.buildings.forEach(building => {
            const screenPos = this.gridToScreen(building.position.x, building.position.y);
            
            if (screenPos.x < -this.tileSize || screenPos.x > this.canvas.width ||
                screenPos.y < -this.tileSize || screenPos.y > this.canvas.height) {
                return; // Skip buildings outside view
            }

            this.ctx.fillStyle = this.buildingColors[building.type] || '#666';
            this.ctx.fillRect(
                screenPos.x,
                screenPos.y,
                this.tileSize,
                this.tileSize
            );
        });
    }

    drawPlacementPreview() {
        if (this.selectedBuilding) {
            const gridPos = this.screenToGrid(this.mousePos.x, this.mousePos.y);
            const screenPos = this.gridToScreen(gridPos.x, gridPos.y);

            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = this.buildingColors[this.selectedBuilding] || '#666';
            this.ctx.fillRect(
                screenPos.x,
                screenPos.y,
                this.tileSize,
                this.tileSize
            );
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawPlayers() {
        if (!this.worldState) return;

        Object.values(this.worldState.players).forEach(player => {
            const screenPos = this.gridToScreen(player.position.x, player.position.y);
            
            this.ctx.fillStyle = player.id === this.playerId ? '#00ff00' : '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(
                screenPos.x + this.tileSize / 2,
                screenPos.y + this.tileSize / 2,
                this.tileSize / 3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw game elements
        this.drawGrid();
        this.drawBuildings();
        this.drawPlayers();
        this.drawPlacementPreview();
    }

    startGameLoop() {
        const gameLoop = () => {
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 