const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// --- BANCO DE DADOS EM MEMÓRIA ---
// Como não estamos usando o disco persistente, os dados ficarão em memória.
// ELES SERÃO REINICIADOS quando o servidor do Render hibernar.
let dbData = {
    totalVisits: 0,
    totalSearches: 0, // Novo contador para buscas
    visits: [], // Armazenará objetos { ip: '...', timestamp: ... }
    origins: {}
};

// Habilita o CORS para permitir requisições do seu site
app.use(cors());
// Habilita o Express para entender JSON em requisições POST
app.use(express.json());
// Confia no proxy do Render para obter o IP correto do visitante
app.set('trust proxy', 1);

// --- NOVOS ENDPOINTS ---

/**
 * ENDPOINT 1: GET /api/metrics
 * Apenas LÊ e calcula os dados. Não modifica nada.
 * Isso resolve o Problema 2 (clicar no relatório não conta mais como visita).
 */
app.get('/api/metrics', (req, res) => {
    try {
        const now = Date.now();

        // --- CÁLCULO DAS MÉTRICAS ---
        
        // 1. Acessos na semana (visitas nos últimos 7 dias)
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const recentVisitsForWeekly = dbData.visits.filter(visit => visit.timestamp > sevenDaysAgo);
        const weeklyVisits = recentVisitsForWeekly.length;

        // 2. Usuários conectados (IPs únicos nos últimos 5 minutos)
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        const recentVisitsForUsers = dbData.visits.filter(visit => visit.timestamp > fiveMinutesAgo);
        const connectedUsers = new Set(recentVisitsForUsers.map(visit => visit.ip)).size;
        
        // 3. Simulação de acessos internos vs. externos
        const internal = Math.floor(dbData.totalVisits * 0.3);
        const external = dbData.totalVisits - internal;

        // Retorna os dados calculados para o front-end
        res.json({
            connectedUsers: connectedUsers,
            totalVisits: dbData.totalVisits,
            weeklyVisits: weeklyVisits, // Mantido, caso você queira usar
            totalSearches: dbData.totalSearches, // Retorna o novo contador
            internal: internal,
            external: external,
            origins: dbData.origins
        });

    } catch (error) {
        console.error("Erro ao obter métricas:", error);
        res.status(500).json({ error: "Não foi possível obter as métricas" });
    }
});

/**
 * ENDPOINT 2: POST /api/visit
 * Apenas REGISTRA uma nova visita.
 * Isso é chamado uma única vez quando o site carrega.
 */
app.post('/api/visit', (req, res) => {
    try {
        const now = Date.now();
        const ip = req.ip; // Obtém o IP do visitante

        // --- RASTREAMENTO DO ACESSO ATUAL ---
        dbData.totalVisits += 1;
        dbData.visits.push({ ip, timestamp: now });
        dbData.origins[ip] = (dbData.origins[ip] || 0) + 1;
        
        console.log(`Visita registrada do IP: ${ip}. Total: ${dbData.totalVisits}`);
        res.status(201).json({ success: true, totalVisits: dbData.totalVisits });

    } catch (error) {
        console.error("Erro ao registrar visita:", error);
        res.status(500).json({ error: "Não foi possível registrar a visita" });
    }
});

/**
 * ENDPOINT 3: POST /api/search
 * Apenas REGISTRA uma nova busca.
 * Isso é chamado quando o formulário de busca é enviado.
 */
app.post('/api/search', (req, res) => {
    try {
        dbData.totalSearches += 1;
        
        console.log(`Busca registrada. Total: ${dbData.totalSearches}`);
        res.status(201).json({ success: true, totalSearches: dbData.totalSearches });

    } catch (error) {
        console.error("Erro ao registrar busca:", error);
        res.status(500).json({ error: "Não foi possível registrar a busca" });
    }
});


app.listen(port, () => {
  console.log(`Servidor de métricas rodando na porta ${port}`);
});