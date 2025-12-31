// Email service using EmailJS (free tier: 200 emails/month)
// Sign up at https://www.emailjs.com/ to get your keys

import logger from '@/utils/logger';
import { isValidEmail, sanitizeString } from '@/utils/validation';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'demo';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'demo';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'demo';

export interface EmailData {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
}

export interface PriceAlert {
  gameTitle: string;
  currentPrice: number;
  targetPrice: number;
  savings: number;
  dealUrl?: string;
}

export interface DealReport {
  games: Array<{
    title: string;
    currentPrice: number;
    originalPrice: number;
    discount: number;
    store: string;
    dealUrl: string;
  }>;
  totalSavings: number;
  generatedAt: Date;
}

// Check if EmailJS is configured
export const isEmailConfigured = (): boolean => {
  return EMAILJS_SERVICE_ID !== 'demo' && 
         EMAILJS_TEMPLATE_ID !== 'demo' && 
         EMAILJS_PUBLIC_KEY !== 'demo';
};

// Initialize EmailJS (call once on app load)
export const initEmailJS = async (): Promise<void> => {
  if (!isEmailConfigured()) {
    logger.log('📧 Email service running in demo mode');
    return;
  }

  try {
    // Dynamically import EmailJS only if configured
    const emailjs = await import('@emailjs/browser');
    emailjs.init(EMAILJS_PUBLIC_KEY);
    logger.log('📧 EmailJS initialized');
  } catch (error) {
    logger.error('Failed to initialize EmailJS:', error);
  }
};

// Send a generic email
export const sendEmail = async (data: EmailData): Promise<{ success: boolean; message: string }> => {
  // Validate email
  if (!isValidEmail(data.to_email)) {
    return { success: false, message: 'Email inválido' };
  }

  // Sanitize inputs
  const sanitizedData = {
    ...data,
    to_name: sanitizeString(data.to_name),
    subject: sanitizeString(data.subject),
    message: sanitizeString(data.message),
  };

  if (!isEmailConfigured()) {
    // Demo mode - simulate sending
    logger.log('📧 [DEMO] Email would be sent:', sanitizedData.to_email);
    return { 
      success: true, 
      message: 'Modo demo: El email se enviaría a ' + sanitizedData.to_email 
    };
  }

  try {
    const emailjs = await import('@emailjs/browser');
    
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: sanitizedData.to_email,
        to_name: sanitizedData.to_name,
        subject: sanitizedData.subject,
        message: sanitizedData.message,
      },
      EMAILJS_PUBLIC_KEY
    );

    return { success: true, message: 'Email enviado correctamente' };
  } catch (error) {
    logger.error('Error sending email:', error);
    return { 
      success: false, 
      message: 'Error al enviar email' 
    };
  }
};

// Format price alerts into email content
export const formatPriceAlertEmail = (
  alerts: PriceAlert[],
  language: 'es' | 'en' = 'es',
  currency: 'EUR' | 'USD' = 'EUR'
): string => {
  const currencySymbol = currency === 'EUR' ? '€' : '$';
  
  const texts = {
    es: {
      title: '🎮 ¡Alertas de Precio!',
      intro: 'Los siguientes juegos de tu lista de seguimiento han alcanzado tu precio objetivo:',
      game: 'Juego',
      current: 'Precio actual',
      target: 'Tu objetivo',
      savings: 'Ahorras',
      footer: '¡No te pierdas estas ofertas!',
    },
    en: {
      title: '🎮 Price Alerts!',
      intro: 'The following games from your wishlist have reached your target price:',
      game: 'Game',
      current: 'Current price',
      target: 'Your target',
      savings: 'You save',
      footer: "Don't miss these deals!",
    },
  };

  const t = texts[language];
  
  let content = `${t.title}\n\n${t.intro}\n\n`;
  
  alerts.forEach((alert, index) => {
    content += `${index + 1}. ${alert.gameTitle}\n`;
    content += `   ${t.current}: ${currencySymbol}${alert.currentPrice.toFixed(2)}\n`;
    content += `   ${t.target}: ${currencySymbol}${alert.targetPrice.toFixed(2)}\n`;
    content += `   ${t.savings}: ${currencySymbol}${alert.savings.toFixed(2)}\n`;
    if (alert.dealUrl) {
      content += `   🔗 ${alert.dealUrl}\n`;
    }
    content += '\n';
  });

  content += `\n${t.footer}\n`;
  content += '\n---\nGame Deals Tracker';

  return content;
};

// Format deal report into email content
export const formatDealReportEmail = (
  report: DealReport,
  language: 'es' | 'en' = 'es',
  currency: 'EUR' | 'USD' = 'EUR'
): string => {
  const currencySymbol = currency === 'EUR' ? '€' : '$';
  const dateStr = report.generatedAt.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const texts = {
    es: {
      title: '🎮 Informe de Ofertas de Juegos',
      date: 'Fecha',
      intro: 'Aquí están las mejores ofertas de tus juegos en seguimiento:',
      game: 'Juego',
      price: 'Precio',
      original: 'Original',
      discount: 'Descuento',
      store: 'Tienda',
      totalSavings: 'Ahorro total potencial',
      footer: '¡Felices compras!',
      noDeals: 'No hay ofertas activas en este momento para tus juegos.',
    },
    en: {
      title: '🎮 Game Deals Report',
      date: 'Date',
      intro: "Here are the best deals on your tracked games:",
      game: 'Game',
      price: 'Price',
      original: 'Original',
      discount: 'Discount',
      store: 'Store',
      totalSavings: 'Total potential savings',
      footer: 'Happy gaming!',
      noDeals: 'No active deals on your tracked games right now.',
    },
  };

  const t = texts[language];
  
  let content = `${t.title}\n`;
  content += `${t.date}: ${dateStr}\n\n`;

  if (report.games.length === 0) {
    content += `${t.noDeals}\n`;
  } else {
    content += `${t.intro}\n\n`;
    
    report.games.forEach((game, index) => {
      content += `${index + 1}. ${game.title}\n`;
      content += `   ${t.price}: ${currencySymbol}${game.currentPrice.toFixed(2)} (${t.original}: ${currencySymbol}${game.originalPrice.toFixed(2)})\n`;
      content += `   ${t.discount}: -${game.discount}%\n`;
      content += `   ${t.store}: ${game.store}\n`;
      content += `   🔗 ${game.dealUrl}\n\n`;
    });

    content += `\n💰 ${t.totalSavings}: ${currencySymbol}${report.totalSavings.toFixed(2)}\n`;
  }

  content += `\n${t.footer}\n`;
  content += '\n---\nGame Deals Tracker';

  return content;
};

// Send price alert email
export const sendPriceAlertEmail = async (
  toEmail: string,
  toName: string,
  alerts: PriceAlert[],
  language: 'es' | 'en' = 'es',
  currency: 'EUR' | 'USD' = 'EUR'
): Promise<{ success: boolean; message: string }> => {
  const subject = language === 'es' 
    ? `🎮 ¡${alerts.length} juego(s) han alcanzado tu precio objetivo!`
    : `🎮 ${alerts.length} game(s) reached your target price!`;

  const message = formatPriceAlertEmail(alerts, language, currency);

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject,
    message,
  });
};

// Send deal report email
export const sendDealReportEmail = async (
  toEmail: string,
  toName: string,
  report: DealReport,
  language: 'es' | 'en' = 'es',
  currency: 'EUR' | 'USD' = 'EUR'
): Promise<{ success: boolean; message: string }> => {
  const subject = language === 'es'
    ? `🎮 Tu informe de ofertas de juegos - ${report.games.length} ofertas`
    : `🎮 Your game deals report - ${report.games.length} deals`;

  const message = formatDealReportEmail(report, language, currency);

  return sendEmail({
    to_email: toEmail,
    to_name: toName,
    subject,
    message,
  });
};
