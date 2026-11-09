// ============================================
// FinControl — Main Entry Point
// ============================================
import './style.css';
import { router } from './router.js';
import { setupNotificationListener } from './notificationParser.js';
import { store } from './financeStore.js';
import { renderDashboard, mountDashboard } from './pages/dashboard.js';
import { renderPayments, mountPayments } from './pages/payments.js';
import { renderCards, mountCards } from './pages/cards.js';
import { renderSettings, mountSettings } from './pages/settings.js';

// --- Update header date ---
function updateHeaderDate() {
  const el = document.getElementById('header-date');
  if (el) {
    const now = new Date();
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    el.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  }
}

// --- Register pages ---
router.register('dashboard', renderDashboard);
router.register('payments', renderPayments);
router.register('cards', renderCards);
router.register('settings', renderSettings);

// --- Mount callbacks ---
router.onMount('dashboard', mountDashboard);
router.onMount('payments', mountPayments);
router.onMount('cards', mountCards);
router.onMount('settings', mountSettings);

// --- Navigation buttons ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    router.navigate(btn.dataset.page);
  });
});

// --- Re-render current page on store change ---
store.subscribe(() => {
  const page = router.currentPage || 'dashboard';
  const container = document.getElementById('page-container');
  if (container && router._routes[page]) {
    container.innerHTML = router._routes[page]();
    if (router._mountCallbacks[page]) {
      router._mountCallbacks[page]();
    }
  }
  updateHeaderDate();
});

// --- Page transition styles ---
const container = document.getElementById('page-container');
if (container) {
  container.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
}

// --- Init ---
updateHeaderDate();
router.init('page-container');

// Default to dashboard
if (!window.location.hash) {
  router.navigate('dashboard');

  // Attempt to listen to notifications automatically on mobile
  setupNotificationListener();
}
