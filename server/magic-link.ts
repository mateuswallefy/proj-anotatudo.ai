import crypto from 'crypto';

interface MagicToken {
  userId: string;
  email: string;
  expires: number;
}

const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutos
const tokenStore = new Map<string, MagicToken>();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET não configurado');
  }
  return secret;
}

function generateHMAC(data: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(data)
    .digest('hex');
}

export function createMagicToken(userId: string, email: string): string {
  const tokenId = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + MAGIC_LINK_EXPIRY;
  
  const payload = `${tokenId}:${userId}:${email}:${expires}`;
  const signature = generateHMAC(payload);
  const token = `${tokenId}.${signature}`;
  
  tokenStore.set(tokenId, { userId, email, expires });
  
  console.log(`[MagicLink] Token criado para user ${userId} (${email}), expira em 15min`);
  
  return token;
}

export function validateMagicToken(token: string): { userId: string; email: string } | null {
  try {
    const [tokenId, receivedSignature] = token.split('.');
    
    if (!tokenId || !receivedSignature) {
      console.log('[MagicLink] Token inválido: formato incorreto');
      return null;
    }
    
    const storedToken = tokenStore.get(tokenId);
    
    if (!storedToken) {
      console.log('[MagicLink] Token não encontrado ou já usado');
      return null;
    }
    
    if (Date.now() > storedToken.expires) {
      tokenStore.delete(tokenId);
      console.log('[MagicLink] Token expirado');
      return null;
    }
    
    const payload = `${tokenId}:${storedToken.userId}:${storedToken.email}:${storedToken.expires}`;
    const expectedSignature = generateHMAC(payload);
    
    if (receivedSignature !== expectedSignature) {
      console.log('[MagicLink] Assinatura inválida');
      return null;
    }
    
    tokenStore.delete(tokenId);
    console.log(`[MagicLink] Token validado com sucesso para user ${storedToken.userId}`);
    
    return {
      userId: storedToken.userId,
      email: storedToken.email,
    };
  } catch (error) {
    console.error('[MagicLink] Erro ao validar token:', error);
    return null;
  }
}

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  const entries = Array.from(tokenStore.entries());
  for (const [tokenId, token] of entries) {
    if (now > token.expires) {
      tokenStore.delete(tokenId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[MagicLink] Limpeza: ${cleaned} tokens expirados removidos`);
  }
}, 5 * 60 * 1000);
