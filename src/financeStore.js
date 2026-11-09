// ============================================
// FinControl — Finance Store
// LocalStorage and Firebase-backed state management
// ============================================

import { docRef, onSnapshot, setDoc } from './firebaseSync.js';

const STORAGE_KEY = 'fincontrol_data';

const DEFAULT_STATE = {
  currency: 'сўм',
  pensionAmount: 0,
  pensionDay: 5,
  currentBalance: 0,
  setupDone: false,  // first-time setup flag
  balanceSyncMode: 'manual', // 'manual', 'all', 'first'
  usdRate: 12600, // Fallback USD rate
  payments: [],       // empty — user adds their own
  cards: [],
  expenses: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  debugMode: false,
  lastNotification: null,
};

class FinanceStore {
  constructor() {
    this._isSyncingFromCloud = false;
    this._state = this._load();
    this._listeners = [];
    this._checkMonthReset();
    this._fetchUsdRate();
    this._initFirebaseSync();
  }

  _initFirebaseSync() {
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (cloudData) {
          this._isSyncingFromCloud = true;
          this._state = { ...this._state, ...cloudData };
          this._save(); // Saves to localStorage only
          this._notify();
          this._isSyncingFromCloud = false;
        }
      }
    }, (error) => {
      console.warn("Firebase sync error:", error);
    });
  }

  async _fetchUsdRate() {
    try {
      const res = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/');
      const data = await res.json();
      const usdObj = data.find(item => item.Ccy === 'USD');
      if (usdObj && usdObj.Rate) {
        this._state.usdRate = Number(usdObj.Rate);
        this._save();
        this._notify();
      }
    } catch (e) {
      console.warn('Could not fetch USD rate:', e);
    }
  }

  _load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
    return { ...DEFAULT_STATE };
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
      if (!this._isSyncingFromCloud) {
        setDoc(docRef, this._state).catch(e => console.warn('Firebase save err:', e));
      }
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  async forceSync() {
    try {
      await setDoc(docRef, this._state);
    } catch (e) {
      console.warn('Firebase force sync err:', e);
      throw e;
    }
  }

  _checkMonthReset() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (this._state.currentMonth !== currentMonth || this._state.currentYear !== currentYear) {
      this._state.payments.forEach(p => { p.paid = false; });
      this._state.expenses = [];
      this._state.currentMonth = currentMonth;
      this._state.currentYear = currentYear;

      if (now.getDate() >= this._state.pensionDay) {
        this._state.currentBalance += this._state.pensionAmount;
        this._addExpense('Пенсия', this._state.pensionAmount, 'incoming', 'pension');
      }
      this._save();
    }
  }

  // --- Getters ---
  get state() { return this._state; }
  get isSetupDone() { return this._state.setupDone; }
  
  get totalBalance() {
    if (this._state.balanceSyncMode === 'all') {
      return this._state.cards.reduce((sum, c) => sum + c.balance, 0);
    } else if (this._state.balanceSyncMode === 'first') {
      return this._state.cards.length > 0 ? this._state.cards[0].balance : 0;
    }
    return this._state.currentBalance; 
  }

  // Helper to get UZS amount for a payment (converts if USD)
  getPaymentAmountUzs(payment) {
    if (payment.currency === 'USD') {
      return (payment.amount || 0) * (this._state.usdRate || 12600);
    }
    return payment.amount || 0;
  }

  get totalMandatory() {
    return this._state.payments.reduce((sum, p) => sum + this.getPaymentAmountUzs(p), 0);
  }

  get totalPaid() {
    return this._state.payments.filter(p => p.paid).reduce((sum, p) => sum + this.getPaymentAmountUzs(p), 0);
  }

  get totalUnpaid() {
    return this.totalMandatory - this.totalPaid;
  }

  get remainderForMom() {
    const afterPayments = this.totalBalance - this.totalUnpaid;
    const otherExpenses = this._state.expenses
      .filter(e => e.type === 'outgoing' && e.category !== 'mandatory')
      .reduce((sum, e) => sum + e.amount, 0);
    return Math.max(0, afterPayments - otherExpenses);
  }

  get distributed() {
    return this.totalMandatory;
  }

  get unallocated() {
    return Math.max(0, this._state.pensionAmount - this.totalMandatory);
  }

  get isPensionReceived() {
    // Check if there is an incoming transaction with category 'pension' in the current month
    return this._state.expenses.some(e => e.category === 'pension' && e.type === 'incoming');
  }

  get daysUntilPension() {
    if (this.isPensionReceived) return 0;
    const now = new Date();
    const pensionDay = this._state.pensionDay;
    let target = new Date(now.getFullYear(), now.getMonth(), pensionDay);
    if (now.getDate() >= pensionDay) {
      target = new Date(now.getFullYear(), now.getMonth() + 1, pensionDay);
    }
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get nextPensionDate() {
    const now = new Date();
    const pensionDay = this._state.pensionDay;
    let target = new Date(now.getFullYear(), now.getMonth(), pensionDay);
    if (this.isPensionReceived || now.getDate() >= pensionDay) {
      target = new Date(now.getFullYear(), now.getMonth() + 1, pensionDay);
    }
    return target;
  }

  // --- Setup ---
  completeSetup(pensionAmount, pensionDay) {
    this._state.setupDone = true;
    this._state.pensionAmount = Number(pensionAmount) || 0;
    this._state.pensionDay = Number(pensionDay) || 5;
    this._state.currentBalance = this._state.pensionAmount;
    this._addExpense('Начальный баланс', this._state.pensionAmount, 'incoming', 'pension');
    this._save();
    this._notify();
  }

  // --- Actions ---
  setPensionAmount(amount) {
    this._state.pensionAmount = Number(amount) || 0;
    this._save();
    this._notify();
  }

  setBalance(amount) {
    this._state.currentBalance = Number(amount) || 0;
    this._save();
    this._notify();
  }

  setBalanceSyncMode(mode) {
    this._state.balanceSyncMode = mode;
    this._save();
    this._notify();
  }

  setUsdRate(rate) {
    this._state.usdRate = Number(rate) || 12600;
    this._save();
    this._notify();
  }

  setDebugMode(val) {
    this._state.debugMode = !!val;
    this._save();
    this._notify();
  }

  setLastNotification(data) {
    this._state.lastNotification = data;
    this._save();
    this._notify();
  }

  addToBalance(amount) {
    this._state.currentBalance += Number(amount) || 0;
    this._save();
    this._notify();
  }

  markPaid(paymentId) {
    const payment = this._state.payments.find(p => p.id === paymentId);
    if (payment && !payment.paid) {
      payment.paid = true;
      const uzsAmount = this.getPaymentAmountUzs(payment);
      
      // If we are syncing with cards, subtract from the primary card
      if (this._state.balanceSyncMode !== 'manual' && this._state.cards.length > 0) {
        const card = this._state.cards[0];
        card.balance = Math.max(0, card.balance - uzsAmount);
      }
      
      this._state.currentBalance -= uzsAmount;
      this._addExpense(payment.name, uzsAmount, 'outgoing', 'mandatory');
      this._save();
      this._notify();
    }
  }

  markUnpaid(paymentId) {
    const payment = this._state.payments.find(p => p.id === paymentId);
    if (payment && payment.paid) {
      payment.paid = false;
      const uzsAmount = this.getPaymentAmountUzs(payment);
      
      // Revert card balance if sync was active
      if (this._state.balanceSyncMode !== 'manual' && this._state.cards.length > 0) {
        const card = this._state.cards[0];
        card.balance += uzsAmount;
      }

      this._state.currentBalance += uzsAmount;
      const idx = this._state.expenses.findIndex(
        e => e.description === payment.name && e.category === 'mandatory'
      );
      if (idx !== -1) this._state.expenses.splice(idx, 1);
      this._save();
      this._notify();
    }
  }

  updatePayment(paymentId, data) {
    const payment = this._state.payments.find(p => p.id === paymentId);
    if (payment) {
      Object.assign(payment, data);
      this._save();
      this._notify();
    }
  }

  addPayment(payment) {
    const id = 'pay_' + Date.now();
    this._state.payments.push({
      id,
      name: payment.name || 'Платёж',
      icon: payment.icon || 'custom',
      amount: Number(payment.amount) || 0,
      currency: payment.currency || 'UZS', // 'UZS' or 'USD'
      keywords: payment.keywords || '', // for auto-pay matching
      paid: false,
      autopay: payment.autopay || false,
      url: payment.url || '',
      comment: payment.comment || '',
      dueDay: Number(payment.dueDay) || this._state.pensionDay,
    });
    this._save();
    this._notify();
    return id;
  }

  removePayment(paymentId) {
    this._state.payments = this._state.payments.filter(p => p.id !== paymentId);
    this._save();
    this._notify();
  }

  // --- Cards ---
  addCard(card) {
    const id = 'card_' + Date.now();
    this._state.cards.push({
      id,
      bankName: card.bankName || 'Банк',
      system: card.system || 'uzcard',
      lastFour: card.lastFour || '0000',
      balance: Number(card.balance) || 0,
    });
    this._save();
    this._notify();
    return id;
  }

  updateCard(cardId, data) {
    const card = this._state.cards.find(c => c.id === cardId);
    if (card) {
      Object.assign(card, data);
      if (data.balance !== undefined) card.balance = Number(data.balance);
      this._save();
      this._notify();
    }
  }

  removeCard(cardId) {
    this._state.cards = this._state.cards.filter(c => c.id !== cardId);
    this._save();
    this._notify();
  }

  // --- Expenses ---
  _addExpense(description, amount, type = 'outgoing', category = 'other') {
    this._state.expenses.unshift({
      id: 'exp_' + Date.now(),
      description,
      amount: Number(amount),
      type,
      category,
      date: new Date().toISOString(),
    });
  }

  addExpense(description, amount) {
    this._addExpense(description, Number(amount), 'outgoing', 'other');
    this._state.currentBalance -= Number(amount);
    this._save();
    this._notify();
  }

  addIncome(description, amount) {
    this._addExpense(description, Number(amount), 'incoming', 'income');
    this._state.currentBalance += Number(amount);
    this._save();
    this._notify();
  }

  simulatePension() {
    this._state.currentBalance += this._state.pensionAmount;
    
    // Find our main salary card and fund it too
    const salaryCard = this._state.cards.find(c => c.lastFour === '2564');
    if (salaryCard) {
      salaryCard.balance += this._state.pensionAmount;
    }

    this._addExpense('Пенсия', this._state.pensionAmount, 'incoming', 'pension');
    this._save();
    this._notify();
  }

  resetMonth() {
    this._state.payments.forEach(p => { p.paid = false; });
    this._state.expenses = [];
    this._save();
    this._notify();
  }

  resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this._state = { ...DEFAULT_STATE };
    this._notify();
  }

  // --- Subscriptions ---
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _notify() {
    this._listeners.forEach(l => l(this._state));
  }
}

export const store = new FinanceStore();
