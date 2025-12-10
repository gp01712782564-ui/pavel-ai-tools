import { FileSystem, SupportedLanguage } from './types';

export const INITIAL_FILES: FileSystem = [
  { id: 'root', name: 'root', type: 'folder', parentId: null, isOpen: true },
  
  // --- Frontend Structure ---
  { id: 'src', name: 'src', type: 'folder', parentId: 'root', isOpen: true },
  { id: 'public', name: 'public', type: 'folder', parentId: 'root', isOpen: true },
  
  // Python Script
  {
    id: 'main.py',
    name: 'main.py',
    type: 'file',
    language: SupportedLanguage.PYTHON,
    parentId: 'src',
    content: `import random

def guess_number():
    target = random.randint(1, 100)
    print(f"I'm thinking of a number between 1 and 100 (It's {target})")
    
    # Simulate a game loop
    attempts = [50, 25, 75, target]
    
    for guess in attempts:
        print(f"User guesses: {guess}")
        if guess < target:
            print("Too low!")
        elif guess > target:
            print("Too high!")
        else:
            print("Correct! You won!")
            return

guess_number()`
  },

  // Web Project
  {
    id: 'index.html',
    name: 'index.html',
    type: 'file',
    language: SupportedLanguage.HTML,
    parentId: 'public',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pavel AI Tools Preview</title>
    <style>
        body { font-family: 'Inter', sans-serif; background: #f0f9ff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
        h1 { color: #4f46e5; margin-bottom: 1rem; }
        p { color: #6b7280; margin-bottom: 2rem; }
        button { background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: transform 0.1s; }
        button:hover { background: #4338ca; transform: scale(1.05); }
        button:active { transform: scale(0.95); }
    </style>
</head>
<body>
    <div class="card">
        <h1>Welcome to Pavel AI Tools</h1>
        <p>This is a live preview of your web application running in the browser.</p>
        <button id="counter">Clicks: 0</button>
    </div>
    <script>
        const btn = document.getElementById('counter');
        let count = 0;
        btn.addEventListener('click', () => {
            count++;
            btn.textContent = 'Clicks: ' + count;
        });
    </script>
</body>
</html>`
  },

  // --- Backend Structure (Node.js + Express + MongoDB + Docker) ---
  { id: 'backend', name: 'backend', type: 'folder', parentId: 'root', isOpen: false },
  {
    id: 'server.js',
    name: 'server.js',
    type: 'file',
    language: SupportedLanguage.JAVASCRIPT,
    parentId: 'backend',
    content: `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Routes
app.get('/', (req, res) => {
  res.send('Pavel AI Tools Backend is Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`
  },
  {
    id: 'Dockerfile',
    name: 'Dockerfile',
    type: 'file',
    language: SupportedLanguage.MARKDOWN, // Treated as text for highlighting
    parentId: 'backend',
    content: `# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]`
  },
  {
    id: 'docker-compose.yml',
    name: 'docker-compose.yml',
    type: 'file',
    language: SupportedLanguage.MARKDOWN, // YAML support simulated
    parentId: 'backend',
    content: `version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/pavel-ai-tools
    depends_on:
      - mongo
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:`
  },
  
  // Readme
  {
    id: 'README.md',
    name: 'README.md',
    type: 'file',
    language: SupportedLanguage.MARKDOWN,
    parentId: 'root',
    content: `# Pavel AI Tools

Welcome to the ultimate AI-powered cloud development environment.

## Project Structure
- **/src**: Frontend logic (Python scripts, etc.)
- **/public**: Web assets (HTML/CSS)
- **/backend**: Node.js + Express API with MongoDB connection
- **Docker**: Full containerization setup included

## Features
- **Multi-language**: Run Python, JS, C++
- **AI-Powered**: Chat, Debug, Generate Code with Gemini 3 Pro
- **GitHub Integration**: Login & Push directly to GitHub
- **Collaboration**: Live sync enabled

## How to Run
1. Explore the files in the sidebar.
2. Click **Run** to execute scripts or preview the website.
3. Use the **AI Chat** to generate new features.
`
  }
];

export const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  'js': SupportedLanguage.JAVASCRIPT,
  'jsx': SupportedLanguage.JAVASCRIPT,
  'ts': SupportedLanguage.TYPESCRIPT,
  'tsx': SupportedLanguage.TYPESCRIPT,
  'py': SupportedLanguage.PYTHON,
  'cpp': SupportedLanguage.CPP,
  'c': SupportedLanguage.CPP,
  'html': SupportedLanguage.HTML,
  'css': SupportedLanguage.CSS,
  'json': SupportedLanguage.JSON,
  'md': SupportedLanguage.MARKDOWN,
  'yml': SupportedLanguage.MARKDOWN, // Map YAML to MD for now
  'yaml': SupportedLanguage.MARKDOWN,
};