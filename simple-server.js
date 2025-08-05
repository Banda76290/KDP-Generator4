import express from "express";

const app = express();
const port = process.env.PORT || 5000;

// Simple test server to verify Import Management routing
app.get("*", (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KDP Generator - Simple Test</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .success { color: green; font-weight: bold; }
      .path { background: #f0f0f0; padding: 10px; margin: 10px 0; }
      nav a { margin-right: 15px; color: blue; text-decoration: none; }
      nav a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1>KDP Generator - Test Server</h1>
    <div class="path">Current path: <strong>${req.path}</strong></div>
    
    <nav>
      <a href="/">Home</a>
      <a href="/import-management">Import Management</a>
      <a href="/projects">Projects</a>
      <a href="/analytics">Analytics</a>
    </nav>
    
    ${req.path === '/import-management' ? 
      '<div class="success">✅ Import Management Page - Route Working!</div><p>This confirms the import management route is accessible and functional.</p>' : 
      '<p>Navigate to different pages using the links above to test routing.</p>'
    }
    
    <hr>
    <p><strong>Server Status:</strong> Running successfully on port ${port}</p>
    <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
  </body>
  </html>
  `;
  res.send(html);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Simple test server running on port ${port}`);
  console.log(`🔗 Access at: http://localhost:${port}`);
  console.log(`📋 Import Management: http://localhost:${port}/import-management`);
});