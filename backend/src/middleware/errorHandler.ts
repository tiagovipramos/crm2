import { Request, Response, NextFunction } from 'express';

// Tipos de erro personalizados
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de tratamento de erros global
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro
  console.error('');
  console.error('❌ ============================================');
  console.error('❌  ERRO CAPTURADO');
  console.error('❌ ============================================');
  console.error('📍 Rota:', req.method, req.originalUrl);
  console.error('👤 Usuário:', req.user?.id || 'Não autenticado');
  console.error('📝 Body:', JSON.stringify(req.body, null, 2));
  console.error('⚠️  Erro:', err.message);
  console.error('📚 Stack:', err.stack);
  console.error('❌ ============================================');
  console.error('');

  // Se é um AppError (erro operacional esperado)
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: 'error'
    });
  }

  // Erros de validação do MySQL
  if (err.message.includes('ER_')) {
    console.error('🔴 Erro de banco de dados MySQL:', err.message);
    
    // Erro de chave duplicada
    if (err.message.includes('ER_DUP_ENTRY')) {
      return res.status(409).json({
        error: 'Registro duplicado',
        details: 'Este registro já existe no sistema'
      });
    }
    
    // Erro de constraint de chave estrangeira
    if (err.message.includes('ER_NO_REFERENCED_ROW')) {
      return res.status(400).json({
        error: 'Referência inválida',
        details: 'Registro relacionado não encontrado'
      });
    }
    
    // Erro de coluna não encontrada
    if (err.message.includes('ER_BAD_FIELD_ERROR')) {
      return res.status(500).json({
        error: 'Erro interno de banco de dados',
        details: 'Campo não encontrado na tabela'
      });
    }
  }

  // Erros de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado'
    });
  }

  // Erros de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.message
    });
  }

  // Em produção, não expor detalhes do erro
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
    });
  }

  // Em desenvolvimento, retornar detalhes completos
  return res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message,
    stack: err.stack
  });
};

// Middleware para capturar rotas não encontradas
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
};

// Middleware para tratamento de erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
