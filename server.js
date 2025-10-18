// server.js
const express = require('express');
const app = express();
const port = 4000; // Porta que o servidor vai usar

// CORS é importante para permitir que seu site (ex: no GitHub Pages) acesse a API
const cors = require('cors');
app.use(cors());

// Rota/Endpoint da API
app.get('/metrics', (req, res) => {
  // --- LÓGICA REAL IRIA AQUI ---
  // Aqui você buscaria os dados do seu banco de dados.
  // Por enquanto, vamos retornar dados de exemplo.

  const realData = {
    connectedUsers: 25,
    totalVisits: 15320,
    weeklyVisits: 350,
    internal: 4890,
    external: 10430,
    origins: {
      "192.168.1.5": 8,
      "200.145.15.3": 12,
    },
  };

  res.json(realData);
});

app.listen(port, () => {
  console.log(`Servidor de métricas rodando em http://localhost:${port}`);
});