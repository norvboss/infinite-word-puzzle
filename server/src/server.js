const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the client directory
app.use(express.static('../client/public'));

// Game state
const worldState = {
  buildings: [],
  resources: [],
  players: {},
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  const playerId = uuidv4();
  console.log(`New player connected: ${playerId}`);

  // Initialize player state
  worldState.players[playerId] = {
    id: playerId,
    position: { x: 0, y: 0 },
    resources: {
      gold: 100,
      wood: 50,
      stone: 50
    }
  };

  // Send initial world state to the new player
  ws.send(JSON.stringify({
    type: 'init',
    playerId: playerId,
    world: worldState
  }));

  // Broadcast new player to others
  broadcast({
    type: 'player_joined',
    player: worldState.players[playerId]
  }, ws);

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handlePlayerAction(ws, playerId, data);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle player disconnect
  ws.on('close', () => {
    console.log(`Player disconnected: ${playerId}`);
    delete worldState.players[playerId];
    broadcast({
      type: 'player_left',
      playerId: playerId
    });
  });
});

// Handle different types of player actions
function handlePlayerAction(ws, playerId, data) {
  const player = worldState.players[playerId];
  if (!player) return;

  switch (data.action) {
    case 'place_building':
      if (isValidBuildingPlacement(data.building, data.position, player)) {
        const building = {
          id: uuidv4(),
          type: data.building.type,
          position: data.position,
          ownerId: playerId,
          createdAt: Date.now()
        };
        worldState.buildings.push(building);
        deductResources(player, data.building.type);
        broadcast({
          type: 'building_placed',
          building: building
        });
      }
      break;

    case 'move':
      player.position = data.position;
      broadcast({
        type: 'player_moved',
        playerId: playerId,
        position: data.position
      });
      break;

    case 'gather_resource':
      // TODO: Implement resource gathering
      break;
  }
}

// Validate building placement
function isValidBuildingPlacement(building, position, player) {
  // Check if player has enough resources
  if (!hasEnoughResources(player, building.type)) return false;

  // Check if position is already occupied
  return !worldState.buildings.some(b => 
    b.position.x === position.x && b.position.y === position.y
  );
}

// Resource cost lookup
const BUILDING_COSTS = {
  house: { gold: 50, wood: 20, stone: 10 },
  farm: { gold: 30, wood: 15, stone: 5 },
  tower: { gold: 100, wood: 30, stone: 50 }
};

// Check if player has enough resources
function hasEnoughResources(player, buildingType) {
  const cost = BUILDING_COSTS[buildingType];
  if (!cost) return false;

  return Object.entries(cost).every(([resource, amount]) => 
    player.resources[resource] >= amount
  );
}

// Deduct resources for building
function deductResources(player, buildingType) {
  const cost = BUILDING_COSTS[buildingType];
  if (!cost) return;

  Object.entries(cost).forEach(([resource, amount]) => {
    player.resources[resource] -= amount;
  });
}

// Broadcast message to all clients except sender
function broadcast(data, exclude) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 