import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { pool } from './config/database';
import { whatsappService } from './services/whatsappService';
import { cleanupService } from './services/cleanupService';

// Rotas
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import mensagensRoutes from './routes/mensagens';
import whatsappRoutes from './routes/whatsapp';
import relatoriosRoutes from './routes/relatorios';
import tarefasRoutes from './routes/tarefas';
import storageRoutes from './routes/storage';
import followupRoutes from './routes/followup';
import indicadorRoutes from './routes/indicador';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://185.217.125.72:3000',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://185.217.125.72:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Servir arquivos estáticos da pasta uploads com headers CORS personalizados
// process.cwd() já aponta para a pasta backend quando o servidor está rodando
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://185.217.125.72:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Definir tipo MIME correto para arquivos de áudio
  if (req.url.endsWith('.ogg')) {
    res.setHeader('Content-Type', 'audio/ogg');
  } else if (req.url.endsWith('.mp3')) {
    res.setHeader('Content-Type', 'audio/mpeg');
  } else if (req.url.endsWith('.wav')) {
    res.setHeader('Content-Type', 'audio/wav');
  } else if (req.url.endsWith('.webm')) {
    res.setHeader('Content-Type', 'audio/webm');
  } else if (req.url.endsWith('.m4a')) {
    res.setHeader('Content-Type', 'audio/mp4');
  }
  
  next();
}, express.static(uploadsPath));
console.log('📁 Pasta uploads disponível em /uploads com CORS');
console.log('📂 Caminho absoluto dos uploads:', uploadsPath);

// Disponibilizar Socket.IO para os controllers
app.set('io', io);

// Configurar Socket.IO no WhatsApp Service
whatsappService.setSocketIO(io);

// Map para rastrear consultores por socket
const consultorSockets = new Map<string, string>(); // socketId -> consultorId

// Socket.IO - Conexões em tempo real
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Consultor se junta a uma room específica
  socket.on('join_consultor', (consultorId: string) => {
    socket.join(`consultor_${consultorId}`);
    consultorSockets.set(socket.id, consultorId);
    console.log(`👤 Consultor ${consultorId} entrou na room (socket: ${socket.id})`);
  });

  // Admin se junta a uma room de admins
  socket.on('join_admin', (adminId: string) => {
    socket.join('admins');
    console.log(`👔 Admin ${adminId} entrou na room de admins`);
  });

  // Consultor marca como online no sistema
  socket.on('consultor_online', async (consultorId: string) => {
    try {
      await pool.query('UPDATE consultores SET sistema_online = TRUE WHERE id = ?', [consultorId]);
      console.log(`✅ Consultor ${consultorId} marcado como online no sistema`);
      // Notificar admins sobre mudança de status
      io.to('admins').emit('consultor_status_mudou', { consultorId, online: true });
    } catch (error) {
      console.error('Erro ao marcar consultor como online:', error);
    }
  });

  // Heartbeat para manter status online
  socket.on('consultor_heartbeat', async (consultorId: string) => {
    try {
      await pool.query('UPDATE consultores SET sistema_online = TRUE, ultimo_acesso = NOW() WHERE id = ?', [consultorId]);
    } catch (error) {
      console.error('Erro no heartbeat do consultor:', error);
    }
  });

  // Consultor marca como offline
  socket.on('consultor_offline', async (consultorId: string) => {
    try {
      await pool.query('UPDATE consultores SET sistema_online = FALSE WHERE id = ?', [consultorId]);
      console.log(`📴 Consultor ${consultorId} marcado como offline no sistema`);
      // Notificar admins sobre mudança de status
      io.to('admins').emit('consultor_status_mudou', { consultorId, online: false });
    } catch (error) {
      console.error('Erro ao marcar consultor como offline:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('🔌 Cliente desconectado:', socket.id);
    
    // Verificar se era um consultor e marcar como offline
    const consultorId = consultorSockets.get(socket.id);
    if (consultorId) {
      try {
        await pool.query('UPDATE consultores SET sistema_online = FALSE WHERE id = ?', [consultorId]);
        console.log(`📴 Consultor ${consultorId} marcado como offline (fechou aba/navegador)`);
        io.to('admins').emit('consultor_status_mudou', { consultorId, online: false });
        consultorSockets.delete(socket.id);
      } catch (error) {
        console.error('Erro ao marcar consultor como offline na desconexão:', error);
      }
    }
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/mensagens', mensagensRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/tarefas', tarefasRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/followup', followupRoutes);
app.use('/api/indicador', indicadorRoutes);
app.use('/api/admin', adminRoutes);

// Disponibilizar Socket.IO globalmente para os services
(global as any).io = io;

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'VIP CRM Backend funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
const start = async () => {
  try {
    // Testar conexão com banco
    await pool.query('SELECT NOW()');
    console.log('✅ Banco de dados conectado');

    httpServer.listen(PORT, () => {
      console.log('');
      console.log('🚀 ============================================');
      console.log('🚀  VIP CRM Backend');
      console.log('🚀 ============================================');
      console.log(`🚀  Servidor rodando em: http://localhost:${PORT}`);
      console.log(`🚀  API disponível em: http://localhost:${PORT}/api`);
      console.log(`🚀  Socket.IO ativo`);
      console.log('🚀 ============================================');
      console.log('');

      // Iniciar limpeza automática de arquivos
      cleanupService.iniciarLimpezaAutomatica();

      // Reconectar sessões do WhatsApp após 5 segundos
      setTimeout(async () => {
        console.log('');
        console.log('🔄 ============================================');
        console.log('🔄  Reconectando Sessões do WhatsApp');
        console.log('🔄 ============================================');
        
        try {
          const fs = require('fs');
          const path = require('path');
          
          // Buscar todas as pastas auth_* no diretório atual
          const files = fs.readdirSync(process.cwd());
          const authFolders = files.filter((file: string) => 
            file.startsWith('auth_') && fs.statSync(path.join(process.cwd(), file)).isDirectory()
          );

          if (authFolders.length === 0) {
            console.log('ℹ️  Nenhuma sessão salva encontrada');
            console.log('🔄 ============================================');
            console.log('');
            return;
          }

          console.log(`📁 ${authFolders.length} sessão(ões) salva(s) encontrada(s)`);
          console.log('');

          // Para cada pasta de autenticação, tentar reconectar
          for (const folder of authFolders) {
            const consultorId = folder.replace('auth_', '');
            console.log(`🔌 Tentando reconectar consultor: ${consultorId}`);
            
            try {
              await whatsappService.tryReconnectExistingSessions(consultorId);
              console.log(`✅ Consultor ${consultorId} reconectado`);
            } catch (error) {
              console.log(`⚠️  Falha ao reconectar consultor ${consultorId}:`, (error as Error).message);
            }
            
            // Aguardar 2 segundos entre reconexões para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          console.log('');
          console.log('✅ Processo de reconexão concluído');
          console.log('🔄 ============================================');
          console.log('');
        } catch (error) {
          console.error('❌ Erro ao reconectar sessões:', error);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

start();
