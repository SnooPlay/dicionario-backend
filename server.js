const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Módulo para interagir com o sistema de arquivos
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, 'database.json'); // Caminho para nosso "banco de dados" em arquivo

// Função para ler os dados do nosso arquivo JSON
const readDB = () => {
    // Se o arquivo não existir, cria um com valores iniciais
    if (!fs.existsSync(DB_PATH)) {
        const initialData = {
            totalVisits: 0,
            visits: [], // Armazenará objetos { ip: '...', timestamp: ... }
            origins: {}
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    // Se existir, apenas lê o conteúdo
    return JSON.parse(fs.readFileSync(DB_PATH));
};

// Função para escrever os dados no arquivo JSON
const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Habilita o CORS para permitir requisições do seu site
app.use(cors());
// Confia no proxy do Render para obter o IP correto do visitante
app.set('trust proxy', 1);

// Rota principal da API que calcula e retorna as métricas
app.get('/metrics', (req, res) => {
    try {
        const dbData = readDB();
        const now = Date.now();
        const ip = req.ip; // Obtém o IP do visitante

        // --- RASTREAMENTO DO ACESSO ATUAL ---
        dbData.totalVisits += 1;
        dbData.visits.push({ ip, timestamp: now });
        dbData.origins[ip] = (dbData.origins[ip] || 0) + 1;

        // --- CÁLCULO DAS MÉTRICAS ---
        // 1. Acessos na semana (visitas nos últimos 7 dias)
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const weeklyVisits = dbData.visits.filter(visit => visit.timestamp > sevenDaysAgo).length;

        // 2. Usuários conectados (IPs únicos nos últimos 5 minutos)
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        const recentVisits = dbData.visits.filter(visit => visit.timestamp > fiveMinutesAgo);
        const connectedUsers = new Set(recentVisits.map(visit => visit.ip)).size;
        
        // 3. Simulação de acessos internos vs. externos (pode ser aprimorado)
        const internal = Math.floor(dbData.totalVisits * 0.3);
        const external = dbData.totalVisits - internal;

        // Salva os dados atualizados no arquivo
        writeDB(dbData);

        // Retorna os dados calculados para o front-end
        res.json({
            connectedUsers: connectedUsers,
            totalVisits: dbData.totalVisits,
            weeklyVisits: weeklyVisits,
            internal: internal,
            external: external,
            origins: dbData.origins
        });

    } catch (error) {
        console.error("Erro ao processar métricas:", error);
        res.status(500).json({ error: "Não foi possível obter as métricas" });
    }
});

app.listen(port, () => {
  console.log(`Servidor de métricas rodando na porta ${port}`);
});