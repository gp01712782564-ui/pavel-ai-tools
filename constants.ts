
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
    print(f"I'm thinking of a number between 1 and 100.")
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
        .card { background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; max-width: 450px; }
        h1 { color: #4f46e5; margin-bottom: 0.5rem; font-weight: 800; }
        .subtitle { color: #6b7280; font-size: 0.9rem; margin-bottom: 2rem; }
        .counter-box { font-size: 3rem; font-weight: 900; color: #111827; margin: 2rem 0; font-family: 'JetBrains Mono', monospace; }
        button { background: #4f46e5; color: white; border: none; padding: 14px 28px; border-radius: 12px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
        button:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
        button:active { transform: translateY(0); }
    </style>
</head>
<body>
    <div class="card">
        <h1>Pavel AI Tools</h1>
        <p class="subtitle">Full-Stack Cloud IDE Environment</p>
        <div class="counter-box" id="display">0</div>
        <button id="counter">Increment Counter</button>
    </div>
    <script>
        const btn = document.getElementById('counter');
        const display = document.getElementById('display');
        let count = 0;
        btn.addEventListener('click', () => {
            count++;
            display.textContent = count;
            display.style.transform = 'scale(1.2)';
            setTimeout(() => display.style.transform = 'scale(1)', 150);
        });
    </script>
</body>
</html>`
  },

  // --- Backend Structure (Node.js + Express + MongoDB + Docker) ---
  { id: 'backend', name: 'backend', type: 'folder', parentId: 'root', isOpen: true },
  { id: 'routes', name: 'routes', type: 'folder', parentId: 'backend', isOpen: true },
  { id: 'models', name: 'models', type: 'folder', parentId: 'backend', isOpen: true },
  
  {
    id: 'server.js',
    name: 'server.js',
    type: 'file',
    language: SupportedLanguage.JAVASCRIPT,
    parentId: 'backend',
    content: `const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const { Server } = require('socket.io');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');

const app = express();
const server = http.createServer(app);

// --- Production Security & Optimization ---
app.use(helmet()); 
app.use(compression());
app.use(express.json({ limit: '50mb' })); 

// CORS
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback for dev
    }
  },
  credentials: true
}));

// Socket.IO
const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST'] 
  }
});

io.on('connection', (socket) => {
  console.log('User Connected:', socket.id);
  socket.on('code_change', (data) => socket.broadcast.emit('code_update', data));
  socket.on('disconnect', () => console.log('User Disconnected'));
});

// DB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => res.send('Pavel AI Tools API'));
app.use('/auth', authRoutes);
app.use('/api/github', githubRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(\`🚀 Server running on port \${PORT}\`));`
  },

  {
    id: 'package.json',
    name: 'package.json',
    type: 'file',
    language: SupportedLanguage.JSON,
    parentId: 'backend',
    content: `{
  "name": "pavel-ai-tools-backend",
  "version": "1.0.0",
  "description": "Production Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.6.3",
    "socket.io": "^4.7.2"
  }
}`
  },

  {
    id: 'User.js',
    name: 'User.js',
    type: 'file',
    language: SupportedLanguage.JAVASCRIPT,
    parentId: 'models',
    content: `const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: { type: String },
  accessToken: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);`
  },

  {
    id: 'auth.js',
    name: 'auth.js',
    type: 'file',
    language: SupportedLanguage.JAVASCRIPT,
    parentId: 'routes',
    content: `const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.get('/github', (req, res) => {
  // REQUEST WORKFLOW SCOPE TO FIX SYNC ISSUES AND REPO ACCESS
  const url = \`https://github.com/login/oauth/authorize?client_id=\${process.env.GITHUB_CLIENT_ID}&scope=repo,user:email,workflow\`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code');

  try {
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('Failed to get access token');

    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: \`token \${accessToken}\` }
    });

    const { id, login, avatar_url } = userRes.data;

    let user = await User.findOne({ githubId: id });
    if (!user) {
      user = new User({ githubId: id, username: login, avatarUrl: avatar_url, accessToken });
    } else {
      user.accessToken = accessToken;
      user.username = login;
      user.avatarUrl = avatar_url;
    }
    await user.save();

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.redirect(\`\${process.env.FRONTEND_URL}?token=\${token}\`);
    
  } catch (err) {
    console.error('OAuth Error:', err.message);
    res.redirect(\`\${process.env.FRONTEND_URL}?error=auth_failed\`);
  }
});

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-accessToken');
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;`
  },

  {
    id: 'github.js',
    name: 'github.js',
    type: 'file',
    language: SupportedLanguage.JAVASCRIPT,
    parentId: 'routes',
    content: `const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const AUTO_REPO_NAME = 'pavel-ai-tools-project';

// Middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};

// Helper: Get Default Branch and SHA
const getRepoState = async (username, repo, headers) => {
  try {
    // 1. Get Repo Info for Default Branch
    const repoInfo = await axios.get(\`https://api.github.com/repos/\${username}/\${repo}\`, { headers });
    const defaultBranch = repoInfo.data.default_branch || 'main';
    
    // 2. Get Ref for Default Branch
    const refRes = await axios.get(\`https://api.github.com/repos/\${username}/\${repo}/git/ref/heads/\${defaultBranch}\`, { headers });
    return { 
      sha: refRes.data.object.sha, 
      branch: defaultBranch 
    };
  } catch (e) {
    // If repo exists but empty, ref might 409 or 404 depending on state
    if (e.response?.status === 409 || e.response?.status === 404) return { sha: null, branch: 'main', empty: true };
    return null;
  }
};

// ATOMIC PUSH Using Git Data API
router.post('/push', verifyToken, async (req, res) => {
  const { files } = req.body; 
  const { accessToken, username } = req.user;
  const REPO = AUTO_REPO_NAME;
  
  const headers = { 
    Authorization: \`token \${accessToken}\`, 
    Accept: 'application/vnd.github.v3+json' 
  };

  try {
    // 1. Ensure Repo Exists
    try {
      await axios.get(\`https://api.github.com/repos/\${username}/\${REPO}\`, { headers });
    } catch (e) {
      if (e.response?.status === 404) {
         await axios.post('https://api.github.com/user/repos', { 
           name: REPO, 
           description: 'Created with Pavel AI Tools',
           auto_init: true
         }, { headers });
         // Wait for repo propagation
         await new Promise(r => setTimeout(r, 4000));
      } else {
        throw e;
      }
    }

    // 2. Get Latest State (Branch + SHA)
    let repoState = await getRepoState(username, REPO, headers);
    
    // Init if we can't find state (e.g. empty repo)
    if (!repoState) {
        try {
            await axios.put(\`https://api.github.com/repos/\${username}/\${REPO}/contents/README.md\`, {
                message: "Initial commit",
                content: Buffer.from("# Pavel AI Tools Project").toString('base64')
            }, { headers });
            await new Promise(r => setTimeout(r, 2000));
            repoState = await getRepoState(username, REPO, headers);
        } catch (initErr) {
             console.error("Init Error:", initErr.response?.data);
        }
    }
    
    if (!repoState) throw new Error("Could not validate repository state. Please check GitHub permissions.");

    const { sha: latestCommitSha, branch } = repoState;

    // 3. Create Blobs
    const treeItems = [];
    const blobPromises = files.map(async (file) => {
        try {
            const blobRes = await axios.post(\`https://api.github.com/repos/\${username}/\${REPO}/git/blobs\`, {
                content: file.content,
                encoding: 'utf-8'
            }, { headers });
            
            return {
                path: file.path,
                mode: '100644', 
                type: 'blob',
                sha: blobRes.data.sha
            };
        } catch (blobErr) {
            console.error(\`Blob failed: \${file.path}\`);
            return null;
        }
    });

    const results = await Promise.all(blobPromises);
    results.forEach(item => { if (item) treeItems.push(item); });

    if (treeItems.length === 0) return res.status(400).json({ error: "No valid files to push" });

    // 4. Create Tree
    const treeRes = await axios.post(\`https://api.github.com/repos/\${username}/\${REPO}/git/trees\`, {
        tree: treeItems,
    }, { headers });
    
    const newTreeSha = treeRes.data.sha;

    // 5. Create Commit
    const newCommitRes = await axios.post(\`https://api.github.com/repos/\${username}/\${REPO}/git/commits\`, {
        message: 'Deployed via Pavel AI Tools',
        tree: newTreeSha,
        parents: latestCommitSha ? [latestCommitSha] : []
    }, { headers });
    
    const newCommitSha = newCommitRes.data.sha;

    // 6. Update Reference (Force Update to handle conflict/non-fast-forward)
    await axios.patch(\`https://api.github.com/repos/\${username}/\${REPO}/git/refs/heads/\${branch}\`, {
        sha: newCommitSha,
        force: true // Ensures we overwrite if history diverged (sync mode)
    }, { headers });

    res.json({ success: true, repoUrl: \`https://github.com/\${username}/\${REPO}\`, branch });

  } catch (err) {
    console.error('GitHub Push Error:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.message || err.message || 'Sync Failed';
    
    if (status === 401 || status === 403) {
         return res.status(401).json({ error: 'Auth expired. Please logout and login again.' });
    }
    
    res.status(status).json({ error: msg });
  }
});

module.exports = router;`
  },

  {
    id: 'Dockerfile',
    name: 'Dockerfile',
    type: 'file',
    language: SupportedLanguage.MARKDOWN,
    parentId: 'backend',
    content: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]`
  },
  {
    id: 'docker-compose.yml',
    name: 'docker-compose.yml',
    type: 'file',
    language: SupportedLanguage.MARKDOWN,
    parentId: 'backend',
    content: `version: '3.8'
services:
  backend:
    build: .
    restart: always
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/pavel-ai-tools
      - PORT=5000
      - FRONTEND_URL=http://localhost:3000
      - JWT_SECRET=production_secret_key
      - GITHUB_CLIENT_ID=\${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=\${GITHUB_CLIENT_SECRET}
    depends_on:
      - mongo
  mongo:
    image: mongo:latest
    restart: always
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:`
  },
  {
    id: '.env.example',
    name: '.env.example',
    type: 'file',
    language: SupportedLanguage.MARKDOWN,
    parentId: 'backend',
    content: `PORT=5000
MONGO_URI=mongodb://mongo:27017/pavel-ai-tools
JWT_SECRET=change_me
FRONTEND_URL=https://your-frontend-app.com
GITHUB_CLIENT_ID=get_from_github
GITHUB_CLIENT_SECRET=get_from_github`
  },
  {
    id: 'README.md',
    name: 'README.md',
    type: 'file',
    language: SupportedLanguage.MARKDOWN,
    parentId: 'root',
    content: `# Pavel AI Tools

## Deployment Instructions

### 1. Backend (Railway/Render)
Deploy the \`backend\` folder. Set environment variables:
- \`MONGO_URI\`: Your database string
- \`FRONTEND_URL\`: Your Vercel URL
- \`GITHUB_CLIENT_ID\`: From GitHub
- \`GITHUB_CLIENT_SECRET\`: From GitHub

### 2. Frontend (Vercel)
Deploy the frontend. Set environment variable:
- \`VITE_API_URL\`: URL of your deployed backend

### 3. GitHub OAuth
Set "Authorization callback URL" in GitHub to:
\`https://YOUR_BACKEND_URL/auth/github/callback\`
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
  'yml': SupportedLanguage.MARKDOWN, 
  'yaml': SupportedLanguage.MARKDOWN,
};
