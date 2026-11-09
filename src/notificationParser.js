import { registerPlugin } from '@capacitor/core';
import { store } from './financeStore.js';
import { showToast } from './ui.js';

const NotificationMonitor = registerPlugin('NotificationMonitor');

export async function setupNotificationListener() {
  try {
    // Check permission
    const { hasPermission } = await NotificationMonitor.checkPermission();
    if (!hasPermission) {
      console.warn("No notification permission. Please request it via UI.");
      // We will expose a way to request permission in settings
    }

    // Listen to push events
    NotificationMonitor.addListener('onNotification', (data) => {
      console.log('Got Push:', data);
      handlePushEvent(data.package, data.title, data.text);
    });

  } catch (error) {
    console.error("NotificationListener not supported on this platform.", error);
  }
}

export async function requestNotificationPermission() {
  const { hasPermission } = await NotificationMonitor.checkPermission();
  if (!hasPermission) {
    await NotificationMonitor.requestPermission();
    return 'requested';
  }
  return 'granted';
}

function handlePushEvent(pkg, title, text) {
  // Store for debug view regardless
  store.setLastNotification({
    title,
    text,
    package: pkg,
    time: new Date().toLocaleTimeString('ru-RU')
  });

  if (store.state.debugMode) {
    showToast(`Debug Notif: [${title}] ${text.substring(0, 30)}...`, 'info');
  }

  if (!text) return;

  // Cleanup text
  const cleanText = text.replace(/,/g, '').toLowerCase();

  // Basic variables
  let amountMatched = 0;
  let isExpense = false;
  let isIncome = false;
  let isTransfer = false;
  let extractedCardLast4 = null;

  // --- Regex Rules ---
  // Look for sum (e.g. 50000.00 UZS or 13.94 USD)
  const amountMatch = cleanText.match(/([0-9\s]+(?:\.[0-9]+)?)\s*(uzs|сум|sum|usd|eur)/i);
  if (amountMatch) {
    amountMatched = Number(amountMatch[1].replace(/\s/g, ''));
    if (amountMatch[2].toLowerCase() === 'usd') {
      amountMatched = amountMatched * (store.state.usdRate || 12600);
    }
  }

  // Card matching (e.g. *1234 or •1234 or **1234 or *78894784*)
  const cardMatch = cleanText.match(/(?:\*|•|x)+(\d+)/i) || (title && title.match(/(?:\*|•|x)+(\d+)/i));
  if (cardMatch) {
    extractedCardLast4 = cardMatch[1].slice(-4);
  }

  // Intent parsing
  if (cleanText.includes('списание') || cleanText.includes('oplata') || cleanText.includes('pokupka') || cleanText.includes('perevod s karty') || cleanText.includes('payment') || title.toLowerCase().includes('списание')) {
    isExpense = true;
  }
  else if (cleanText.includes('поступление') || cleanText.includes('zachislena') || cleanText.includes('popolnenie') || cleanText.includes('perevod na kartu') || cleanText.includes('income')) {
    isIncome = true;
  }
  else if (cleanText.includes('перевод') && (cleanText.includes('mezhdu') || cleanText.includes('своими') || cleanText.includes('internal'))) {
    isTransfer = true;
  }

  // --- Execute Logic based on parsed data ---
  if (amountMatched === 0) return; // couldn't parse amount

  if (isTransfer) {
    // Internal transfer usually means money moved between our own cards.
    // Right now we only have general balance, so we might not need to subtract total balance.
    showToast(`Определен перевод между своими (${amountMatched} сўм)`, 'success');
    return;
  }

  if (isIncome) {
    // Find card if any
    let cardObj = null;
    
    // The user's salary account ends in 4784, but it is physically attached to card 2564.
    if (cleanText.includes('zachislena') || extractedCardLast4 === '4784') {
      extractedCardLast4 = '2564';
    }

    if (extractedCardLast4) {
      cardObj = store.state.cards.find(c => c.lastFour === extractedCardLast4);
    }
    
    // Update global income/pension amount if it's zachislena
    if (cleanText.includes('zachislena') && typeof store.setPensionAmount === 'function') {
      store.setPensionAmount(amountMatched);
    }

    if (cardObj) {
      store.updateCard(cardObj.id, { balance: cardObj.balance + amountMatched });
    }

    // Always add to manual balance just in case
    store.addToBalance(amountMatched);
    
    const category = (cleanText.includes('zachislena') || extractedCardLast4 === '4784' || extractedCardLast4 === '3131' || cleanText.includes('13131')) ? 'pension' : 'auto';
    
    store._addExpense('Авто-Пополнение (' + (cardObj ? cardObj.bankName : 'Карта *' + (extractedCardLast4 || '???')) + ')', amountMatched, 'incoming', category);
    
    if (!cardObj && store.state.balanceSyncMode !== 'manual') {
      showToast(`Авто: найдено +${amountMatched}, но карты *${extractedCardLast4 || '?'} нет в приложении!`, 'error');
    } else {
      showToast(`Авто: зачисление +${amountMatched}`, 'success');
    }
  }

  if (isExpense) {
    let cardObj = null;
    if (extractedCardLast4) {
      cardObj = store.state.cards.find(c => c.lastFour === extractedCardLast4);
    }

    if (cardObj) {
      store.updateCard(cardObj.id, { balance: Math.max(0, cardObj.balance - amountMatched) });
    } else if (store.state.balanceSyncMode !== 'manual') {
      showToast(`Списание с неизвестной карты *${extractedCardLast4 || '?'}!`, 'warning');
    }

    // Check for auto-pay match using keywords or fallback to amount match
    let matchedPayment = null;
    let fallbackAmountMatches = [];
    const upperContent = (title + ' ' + text).toUpperCase();

    for (const p of store.state.payments) {
      if (!p.paid) {
        // 1. Keyword matching (strongest)
        if (p.keywords) {
          const words = p.keywords.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
          if (words.length > 0 && words.some(w => upperContent.includes(w))) {
            matchedPayment = p;
            break; // Stop looking, keyword match is definitive
          }
        }
        
        // 2. Amount matching (with 1% bank fee support)
        const pUzs = store.getPaymentAmountUzs(p);
        const pWithFee = pUzs * 1.01;
        
        const isExact = Math.abs(pUzs - amountMatched) < 1000;
        const isWithFee = Math.abs(pWithFee - amountMatched) < 1000;

        if (isExact || isWithFee) {
          fallbackAmountMatches.push(p);
        }
      }
    }

    // If no keyword match was found, but there is EXACTLY ONE payment with this amount, mark it
    if (!matchedPayment && fallbackAmountMatches.length === 1) {
      matchedPayment = fallbackAmountMatches[0];
    }

    if (matchedPayment) {
      store.markPaid(matchedPayment.id);
      showToast(`Авто-оплата: ${matchedPayment.name} ✓`, 'success');
      // No need to double add the expense, markPaid already adds an expense entry
    } else {
      store.addExpense('Авто-Возврат/Оплата (' + (cardObj ? cardObj.bankName : 'Карта') + ')', amountMatched);
      showToast(`Авто: списание -${amountMatched}`, 'error');
    }
  }
}
