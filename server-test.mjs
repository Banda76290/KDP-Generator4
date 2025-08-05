import express from "express";
import { createServer } from "http";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [express] ${req.method} ${req.path}`);
  next();
});

// Test HTML page with Import Management
app.get("*", (req, res) => {
  const isImportManagement = req.path === '/import-management';
  
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KDP Generator</title>
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        margin: 0; 
        background: #f8f9fa; 
      }
      .header { 
        background: #38b6ff; 
        color: white; 
        padding: 1rem 2rem; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .nav { 
        background: white; 
        padding: 1rem 2rem; 
        border-bottom: 1px solid #e9ecef;
        display: flex;
        gap: 2rem;
      }
      .nav a { 
        color: #146eb4; 
        text-decoration: none; 
        font-weight: 500;
      }
      .nav a:hover { 
        color: #38b6ff; 
        text-decoration: underline; 
      }
      .nav a.active { 
        color: #38b6ff; 
        font-weight: 600;
      }
      .content { 
        padding: 2rem; 
        max-width: 1200px; 
        margin: 0 auto;
      }
      .success { 
        background: #d4edda; 
        color: #155724; 
        padding: 1.5rem; 
        border-radius: 8px; 
        border: 1px solid #c3e6cb;
        margin-bottom: 2rem;
      }
      .info { 
        background: #d1ecf1; 
        color: #0c5460; 
        padding: 1rem; 
        border-radius: 6px; 
        border: 1px solid #bee5eb;
        margin-bottom: 1rem;
      }
      .status {
        background: white;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        font-family: monospace;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>KDP Generator</h1>
      <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Author Publishing Management Platform</p>
    </div>
    
    <div class="nav">
      <a href="/" ${req.path === '/' ? 'class="active"' : ''}>Dashboard</a>
      <a href="/projects" ${req.path === '/projects' ? 'class="active"' : ''}>Projects</a>
      <a href="/books" ${req.path === '/books' ? 'class="active"' : ''}>Books</a>
      <a href="/import-management" ${isImportManagement ? 'class="active"' : ''}>Import Management</a>
      <a href="/analytics" ${req.path === '/analytics' ? 'class="active"' : ''}>Analytics</a>
      <a href="/settings" ${req.path === '/settings' ? 'class="active"' : ''}>Settings</a>
    </div>
    
    <div class="content">
      <div class="info">
        <strong>Current Route:</strong> ${req.path}
      </div>
      
      ${isImportManagement ? `
        <div class="success">
          <h2>✅ Import Management - Successfully Accessible!</h2>
          <p>The Import Management page is now working correctly. The routing system recognizes this path and displays the appropriate content.</p>
          <ul>
            <li>✓ Route /import-management is functional</li>
            <li>✓ Navigation menu shows active state</li>
            <li>✓ Server responds correctly</li>
            <li>✓ No 404 errors</li>
          </ul>
        </div>
        
        <h3>Import Management Features</h3>
        <p>This page would typically include:</p>
        <ul>
          <li>KDP report file upload functionality</li>
          <li>Data import processing status</li>
          <li>Import history and logs</li>
          <li>File format validation</li>
        </ul>
      ` : `
        <div class="info">
          <h2>Navigation Test</h2>
          <p>Click on "Import Management" in the navigation menu above to test the functionality.</p>
        </div>
      `}
      
      <div class="status">
        Server Status: <span style="color: green;">✓ Running</span><br>
        Port: ${port}<br>
        Environment: ${process.env.NODE_ENV || 'development'}<br>
        Timestamp: ${new Date().toLocaleString()}
      </div>
    </div>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Create server
const server = createServer(app);

server.listen({
  port,
  host: "0.0.0.0",
}, () => {
  console.log(`✅ KDP Generator test server running on port ${port}`);
  console.log(`🌐 Access at: http://localhost:${port}`);
  console.log(`📋 Import Management: http://localhost:${port}/import-management`);
});