const http = require("http");
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/test-connection") {
    let body=""; req.on("data",c=>body+=c); req.on("end",()=>{
      const p = JSON.parse(body||"{}");
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({ success:true, message:`Mock OK for ${p.target||'unknown'}`, diagnostics:{ping:12,details:'mock',latencyMs:12}}));
    }); return;
  }
  if (req.method === "POST" && req.url === "/query") {
    let body=""; req.on("data",c=>body+=c); req.on("end",()=>{
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({
        success: true,
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-20' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-25' }
        ],
        query: '-- Mock SQL query',
        executionTime: Math.floor(Math.random() * 500) + 50, // Random execution time 50-550ms
        performanceMetrics: {
          executionTime: Math.floor(Math.random() * 500) + 50,
          rowsAffected: 3,
          memoryUsage: Math.random() * 100 + 20, // 20-120 MB
          cpuUsage: Math.random() * 40 + 10, // 10-50%
          queryComplexityScore: Math.floor(Math.random() * 7) + 1, // 1-7
          peakMemoryUsage: Math.random() * 150 + 30, // 30-180 MB
          totalBytesProcessed: Math.floor(Math.random() * 10000) + 1000, // 1-11 KB
          cacheHits: Math.floor(Math.random() * 5),
          cacheMisses: Math.floor(Math.random() * 3),
          networkLatency: Math.random() * 30 + 2 // 2-32ms
        }
      }));
    }); return;
  }
  res.writeHead(404); res.end();
});
server.listen(8000,()=>console.log('Mock MCP listening on http://127.0.0.1:8000'));
