# Multiplayer Building Simulation

A real-time multiplayer building simulation game where players can collaboratively build and interact in a shared world using WebSocket technology.

## Features

- Real-time multiplayer interaction
- Grid-based building system
- Resource management (Gold, Wood, Stone)
- Multiple building types (House, Farm, Tower)
- Camera controls for map navigation
- Live player position updates
- Building placement preview
- Status notifications

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd multiplayer-building-sim
```

2. Install dependencies:
```bash
cd server
npm install
```

## Running the Game

1. Start the server:
```bash
cd server
npm start
```

2. Open your web browser and navigate to:
```
http://localhost:3000
```

## How to Play

1. Use the arrow keys to move the camera around the map
2. Click on a building type in the right panel to select it
3. Click on the grid to place the selected building
4. Monitor your resources in the right panel
5. Collaborate with other players in real-time

## Building Types and Costs

- House
  - Gold: 50
  - Wood: 20
  - Stone: 10

- Farm
  - Gold: 30
  - Wood: 15
  - Stone: 5

- Tower
  - Gold: 100
  - Wood: 30
  - Stone: 50

## Controls

- Arrow Keys: Move camera
- Left Click: Place building
- Building Panel: Select building type

## Technical Details

- Frontend: HTML5 Canvas, JavaScript
- Backend: Node.js, Express, WebSocket (ws)
- Real-time updates using WebSocket protocol
- Grid-based coordinate system
- Client-side prediction and validation

## Contributing

Feel free to submit issues and enhancement requests! 