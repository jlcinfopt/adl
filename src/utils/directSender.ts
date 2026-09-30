import { syncGatewayConfigToCloud } from './cloudSync';

export type WhatsAppProviderPreset = 'ultramsg' | 'make' | 'evolution' | 'zapi' | 'custom_webhook';

export interface DirectGatewayConfig {
  enabled: boolean;
  // WhatsApp Gateway
  whatsappEnabled: boolean;
  whatsappProvider: WhatsAppProviderPreset;
  whatsappGatewayUrl: string;
  whatsappApiToken: string;
  whatsappInstanceId?: string;
  // Email Direct API
  emailEnabled: boolean;
  emailProvider: 'resend' | 'brevo' | 'custom_webhook';
  emailApiKey: string;
  emailSender: string;
}

const GATEWAY_CONFIG_KEY = 'adleiria_direct_gateway_config_v1';

export const DEFAULT_GATEWAY_CONFIG: DirectGatewayConfig = {
  enabled: false,
  whatsappEnabled: false,
  whatsappProvider: 'ultramsg',
  whatsappGatewayUrl: '',
  whatsappApiToken: '',
  whatsappInstanceId: '',
  emailEnabled: false,
  emailProvider: 'resend',
  emailApiKey: '',
  emailSender: 'AD Leiria Integrarte <onboarding@resend.dev>',
};

/**
 * Normalizes WhatsApp API URL to ensure the correct endpoints are called
 * (especially for UltraMsg which requires /messages/chat)
 */
export function normalizeWhatsAppGatewayUrl(rawUrl: string, rawToken?: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';

  // If user pasted just instance ID like "instance191265"
  if (/^instance\d+$/i.test(url)) {
    return `https://api.ultramsg.com/${url}/messages/chat`;
  }

  // If UltraMsg URL
  if (url.includes('ultramsg.com')) {
    // Remove query params if any
    const [baseUrl] = url.split('?');
    const cleaned = baseUrl.replace(/\/+$/, '');

    // Extract instance id e.g. /instance191265
    const match = cleaned.match(/(instance\d+)/i);
    if (match) {
      const instanceId = match[1];
      return `https://api.ultramsg.com/${instanceId}/messages/chat`;
    }

    if (!cleaned.endsWith('/messages/chat')) {
      if (cleaned.endsWith('/messages')) {
        return `${cleaned}/chat`;
      }
      return `${cleaned}/messages/chat`;
    }
    return cleaned;
  }

  return url;
}

/**
 * Formats a phone number for WhatsApp international routing (+351 for Portugal if 9 digits)
 */
export function formatWhatsAppRecipientPhone(phone: string): string {
  let clean = (phone || '').replace(/\D/g, '');
  if (!clean) return '';

  // Standard Portugal number (9 digits starting with 9 or 2)
  if (clean.length === 9 && (clean.startsWith('9') || clean.startsWith('2'))) {
    clean = '351' + clean;
  }

  // Prepend '+' for E.164 standard (UltraMsg and gateways accept +351...)
  return '+' + clean;
}

export function getDirectGatewayConfig(): DirectGatewayConfig {
  try {
    const envWhatsappUrl = (import.meta as any).env?.VITE_WHATSAPP_GATEWAY_URL || '';
    const envWhatsappToken = (import.meta as any).env?.VITE_WHATSAPP_API_TOKEN || '';
    const envEmailApiKey = (import.meta as any).env?.VITE_RESEND_API_KEY || '';

    const baseConfig: DirectGatewayConfig = {
      ...DEFAULT_GATEWAY_CONFIG,
      whatsappGatewayUrl: envWhatsappUrl || DEFAULT_GATEWAY_CONFIG.whatsappGatewayUrl,
      whatsappApiToken: envWhatsappToken || DEFAULT_GATEWAY_CONFIG.whatsappApiToken,
      whatsappEnabled: Boolean(envWhatsappUrl) || DEFAULT_GATEWAY_CONFIG.whatsappEnabled,
      enabled: Boolean(envWhatsappUrl || envEmailApiKey) || DEFAULT_GATEWAY_CONFIG.enabled,
      emailApiKey: envEmailApiKey || DEFAULT_GATEWAY_CONFIG.emailApiKey,
      emailEnabled: Boolean(envEmailApiKey) || DEFAULT_GATEWAY_CONFIG.emailEnabled,
    };

    const raw = localStorage.getItem(GATEWAY_CONFIG_KEY);
    if (!raw) return baseConfig;
    const parsed = JSON.parse(raw);
    const config: DirectGatewayConfig = { ...baseConfig, ...parsed };

    // Automatically fix URL if it was saved with missing /messages/chat (e.g. from user pasting instance URL)
    if (config.whatsappGatewayUrl) {
      config.whatsappGatewayUrl = normalizeWhatsAppGatewayUrl(
        config.whatsappGatewayUrl,
        config.whatsappApiToken
      );
    }

    return config;
  } catch (err) {
    console.error('Error reading gateway config:', err);
    return DEFAULT_GATEWAY_CONFIG;
  }
}

export function saveDirectGatewayConfig(config: DirectGatewayConfig): void {
  try {
    const normalized: DirectGatewayConfig = {
      ...config,
      whatsappGatewayUrl: normalizeWhatsAppGatewayUrl(
        config.whatsappGatewayUrl,
        config.whatsappApiToken
      ),
    };
    // 1. Save to local storage for fast instant load
    localStorage.setItem(GATEWAY_CONFIG_KEY, JSON.stringify(normalized));

    // 2. Persist to Firestore Cloud Database so it NEVER gets lost across devices/sessions/domains
    syncGatewayConfigToCloud(normalized).catch((err) => {
      console.warn('Notice syncing gateway config to cloud:', err);
    });
  } catch (err) {
    console.error('Error saving gateway config:', err);
  }
}

/**
 * Applies cloud-synchronized configuration from Firestore into the local runtime
 */
export function applyCloudGatewayConfig(cloudConfig: Partial<DirectGatewayConfig>): DirectGatewayConfig {
  try {
    const current = getDirectGatewayConfig();
    const merged: DirectGatewayConfig = {
      ...current,
      ...cloudConfig,
      whatsappGatewayUrl: normalizeWhatsAppGatewayUrl(
        cloudConfig.whatsappGatewayUrl || current.whatsappGatewayUrl,
        cloudConfig.whatsappApiToken || current.whatsappApiToken
      ),
    };
    localStorage.setItem(GATEWAY_CONFIG_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('Error applying cloud gateway config:', err);
    return getDirectGatewayConfig();
  }
}

/**
 * Sends a WhatsApp message directly via background HTTP API (without opening WhatsApp Web)
 */
export async function sendDirectWhatsAppMessage(
  recipientPhone: string,
  messageText: string,
  config?: DirectGatewayConfig,
  recipientName?: string
): Promise<{ success: boolean; error?: string; notConfigured?: boolean }> {
  const cfg = config || getDirectGatewayConfig();

  // Normalize phone number
  const formattedPhone = formatWhatsAppRecipientPhone(recipientPhone);
  const cleanDigits = formattedPhone.replace(/\D/g, '');
  if (!cleanDigits || cleanDigits.length < 9) {
    return { success: false, error: 'Número de telemóvel inválido ou incompleto.' };
  }

  // If no gateway URL is provided, we MUST NOT pretend it was sent!
  if (!cfg.whatsappGatewayUrl || !cfg.whatsappGatewayUrl.trim().startsWith('http')) {
    return {
      success: false,
      notConfigured: true,
      error: 'Nenhuma API de WhatsApp configurada. Adicione a URL da sua API no menu ⚙️ ou utilize o envio gratuito via WhatsApp Web.',
    };
  }

  const rawUrl = normalizeWhatsAppGatewayUrl(cfg.whatsappGatewayUrl, cfg.whatsappApiToken);
  const token = (cfg.whatsappApiToken || '').trim();
  const isUltraMsg = rawUrl.includes('ultramsg.com') || cfg.whatsappProvider === 'ultramsg';

  // --- 1. SPECIALIZED ULTRA-MSG HANDLER ---
  if (isUltraMsg) {
    try {
      // UltraMsg requires token in URL parameter
      let urlWithToken = rawUrl;
      try {
        const urlObj = new URL(rawUrl);
        if (token && !urlObj.searchParams.has('token')) {
          urlObj.searchParams.set('token', token);
        }
        urlWithToken = urlObj.toString();
      } catch {
        urlWithToken = token ? `${rawUrl}?token=${encodeURIComponent(token)}` : rawUrl;
      }

      // UltraMsg parameters (x-www-form-urlencoded)
      const form = new URLSearchParams();
      if (token) form.append('token', token);
      form.append('to', formattedPhone);
      form.append('body', messageText);
      form.append('priority', '10');

      let res: Response | null = null;
      let errorEncountered: string | null = null;

      // Attempt 1: Direct fetch to UltraMsg
      try {
        res = await fetch(urlWithToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        });
      } catch (directErr: any) {
        // Direct fetch might be blocked by adblock or browser shields, try via local proxy endpoint
        errorEncountered = directErr?.message || 'Falha de rede no navegador';
        try {
          res = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: urlWithToken,
              token,
              to: formattedPhone,
              message: messageText,
            }),
          });
        } catch {
          // Proxy also failed, keep original error
        }
      }

      if (!res) {
        return {
          success: false,
          error: `Não foi possível conectar à UltraMsg: ${errorEncountered || 'Erro de rede'}. Verifique sua conexão com a internet.`,
        };
      }

      const resText = await res.text().catch(() => '');
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch {}

      // Handle UltraMsg error object
      if (data && data.error) {
        let msg = String(data.error);
        const lower = msg.toLowerCase();
        if (lower.includes('wrong token') || lower.includes('token')) {
          msg = 'O Token da UltraMsg está incorreto ou expirado. Copie o Token correto no painel da sua instância em ultramsg.com.';
        } else if (lower.includes('not authorized') || lower.includes('qr') || lower.includes('scan') || lower.includes('disconnected')) {
          msg = 'A sua instância UltraMsg não está conectada ao WhatsApp da igreja. Aceda ao painel do ultramsg.com e escaneie o código QR.';
        } else if (lower.includes('limit') || lower.includes('expired') || lower.includes('trial')) {
          msg = 'O plano de teste da UltraMsg expirou ou atingiu o limite de envio.';
        } else if (lower.includes('path not found')) {
          msg = 'URL da UltraMsg incorreta. O sistema formatou o endpoint automaticamente, por favor clique em testar novamente.';
        }
        return { success: false, error: msg };
      }

      if (!res.ok) {
        return {
          success: false,
          error: `UltraMsg retornou erro HTTP ${res.status}: ${resText || res.statusText}`,
        };
      }

      // Success check: UltraMsg returns { sent: 'true', message: 'ok', id: ... }
      if (data && (data.sent === 'true' || data.sent === true || data.id)) {
        return { success: true };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Falha ao comunicar com a UltraMsg: ${msg}`,
      };
    }
  }

  // --- 2. GENERIC HANDLER (Evolution API, Z-API, Custom Webhooks) ---
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['apikey'] = token;
      headers['Client-Token'] = token;
    }

    const bodyData: Record<string, any> = {
      number: cleanDigits,
      phone: cleanDigits,
      to: formattedPhone,
      message: messageText,
      text: messageText,
      body: messageText,
      name: recipientName || '',
      recipientName: recipientName || '',
    };

    const res = await fetch(rawUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      return {
        success: false,
        error: `A API WhatsApp retornou erro HTTP ${res.status}: ${errorBody || res.statusText}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Falha na conexão com a API WhatsApp: ${msg}. Verifique se a URL da API está correta e aceita conexões.`,
    };
  }
}

/**
 * Tests WhatsApp Gateway Connection by sending a test ping message
 */
export async function testWhatsAppGatewayConnection(
  targetPhone: string,
  config: DirectGatewayConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.whatsappGatewayUrl || !config.whatsappGatewayUrl.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Por favor, insira primeiro a URL da API (deve começar por http:// ou https://).',
    };
  }

  const cleanPhone = targetPhone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 9) {
    return {
      success: false,
      message: 'Insira um número de telemóvel válido para receber a mensagem de teste.',
    };
  }

  const testMessage = `[AD Leiria Integrarte] ✅ Teste de conexão do Gateway WhatsApp realizado com sucesso! Se recebeu esta mensagem, o envio direto está pronto a ser utilizado.`;

  const result = await sendDirectWhatsAppMessage(cleanPhone, testMessage, config);

  if (result.success) {
    return {
      success: true,
      message: '✓ Conexão bem-sucedida! Mensagem de teste enviada para o telemóvel especificado.',
    };
  } else {
    return {
      success: false,
      message: result.error || 'Erro desconhecido ao testar conexão com o Gateway.',
    };
  }
}

/**
 * Sends an email directly via background API (e.g. Resend, Brevo, or webhook) without opening email client
 */
export async function sendDirectEmailMessage(
  recipientEmail: string,
  subject: string,
  messageText: string,
  config?: DirectGatewayConfig
): Promise<{ success: boolean; error?: string; notConfigured?: boolean }> {
  const cfg = config || getDirectGatewayConfig();

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, error: 'Endereço de e-mail inválido.' };
  }

  if (!cfg.emailApiKey || !cfg.emailApiKey.trim()) {
    return {
      success: false,
      notConfigured: true,
      error: 'Chave da API de e-mail (Resend) não configurada. Obtenha uma chave grátis em resend.com ou utilize o envio via Gmail/Outlook.',
    };
  }

  // Resend API
  if (cfg.emailProvider === 'resend') {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.emailApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: cfg.emailSender || 'AD Leiria Integrarte <onboarding@resend.dev>',
          to: [recipientEmail],
          subject: subject,
          text: messageText,
          html: `<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin: 0; font-size: 20px; text-transform: uppercase;">AD Leiria • Ministério Integrarte</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Acolhimento & Palavra Pastoral</p>
            </div>
            <div style="white-space: pre-line; font-size: 15px;">${messageText}</div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              Assembleia de Deus de Leiria • Mensagem de acolhimento pastoral
            </div>
          </div>`,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: res.statusText }));
        return {
          success: false,
          error: `Erro ao enviar e-mail via Resend: ${errJson.message || res.statusText}`,
        };
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Falha na conexão com a API Resend: ${msg}` };
    }
  }

  return { success: false, error: 'Provedor de e-mail não suportado.' };
}

/**
 * Tests Resend Email Connection
 */
export async function testEmailConnection(
  targetEmail: string,
  config: DirectGatewayConfig
): Promise<{ success: boolean; message: string }> {
  if (!config.emailApiKey || !config.emailApiKey.trim()) {
    return {
      success: false,
      message: 'Por favor, insira primeiro a sua chave de API Resend (começa por re_...).',
    };
  }

  const result = await sendDirectEmailMessage(
    targetEmail,
    'AD Leiria • Teste de Conexão de E-mail Direto',
    'Olá! Este é um e-mail de teste para confirmar que o envio direto via Resend está configurado e funcionando perfeitamente.',
    config
  );

  if (result.success) {
    return {
      success: true,
      message: '✓ Conexão bem-sucedida! E-mail de teste enviado para a caixa de entrada.',
    };
  } else {
    return {
      success: false,
      message: result.error || 'Erro ao enviar e-mail de teste.',
    };
  }
}
