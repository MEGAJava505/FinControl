// ============================================
// FinControl — Dashboard Page
// ============================================
import { store } from '../financeStore.js';
import { getIcon } from '../icons.js';
import { showModal, showToast } from '../ui.js';

const formatMoney = (n) => {
  const num = Number(n) || 0;
  const isInt = num % 1 === 0;
  const [int, dec] = num.toFixed(isInt ? 0 : 2).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? '.' + dec : '');
};
const monthNames = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
  'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

export function renderDashboard() {
  const s = store.state;
  const cur = s.currency || 'сўм';

  // Show setup screen if not done
  if (!store.isSetupDone) {
    return renderSetup(cur);
  }

  const daysLeft = store.daysUntilPension;
  const nextDate = store.nextPensionDate;
  const balanceClass = store.totalBalance >= store.totalUnpaid ? 'positive' : store.totalBalance > 0 ? 'warning' : 'negative';
  const paidCount = s.payments.filter(p => p.paid).length;
  const totalCount = s.payments.length;
  const paidPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const recentExpenses = s.expenses.slice(0, 5);

  return `
    <!-- Balance Card -->
    <div class="balance-hero animate-in">
      <div class="balance-label">Общий баланс</div>
      <div class="balance-amount ${balanceClass}">${formatMoney(store.totalBalance)} ${cur}</div>
      <div class="balance-sub">Осталось оплатить: ${formatMoney(store.totalUnpaid)} ${cur}</div>
    </div>

    <!-- Budget Distribution -->
    <div class="glass-card animate-in" style="margin-top: var(--space-md);">
      <div class="flex-between">
        <span class="balance-label" style="margin: 0;">Распределено</span>
        <button class="btn btn-secondary btn-sm" id="edit-income-btn" style="padding: 2px 10px; font-size: 0.7rem;">Изменить</button>
      </div>
      <div style="font-size: 0.85rem; font-weight: 600; margin-top: var(--space-xs);">${formatMoney(store.distributed)} / ${formatMoney(s.pensionAmount)} ${cur}</div>
      <div class="progress-bar-container" style="margin-top: var(--space-sm);">
        <div class="progress-bar">
          <div class="progress-bar-fill ${store.distributed > s.pensionAmount ? 'danger' : ''}" style="width: ${Math.min(100, s.pensionAmount > 0 ? (store.distributed / s.pensionAmount) * 100 : 0)}%"></div>
        </div>
      </div>
      ${store.unallocated > 0 ? `<div style="font-size: 0.75rem; color: var(--clr-text-muted); margin-top: var(--space-xs);">Нераспределено: ${formatMoney(store.unallocated)} ${cur}</div>` : ''}
    </div>

    <!-- Countdown -->
    <div class="glass-card countdown-card animate-in">
      <div class="countdown-circle ${store.isPensionReceived ? 'success' : 'income'}">
        <span>${store.isPensionReceived ? '✓' : daysLeft}</span>
        ${store.isPensionReceived ? '' : '<span class="circle-label">дн.</span>'}
      </div>
      <div class="countdown-info">
        <h3>${store.isPensionReceived ? 'Доход получен' : 'Следующий доход'}</h3>
        <p>${nextDate.getDate()} ${monthNames[nextDate.getMonth()]} · ${formatMoney(s.pensionAmount)} ${cur}</p>
      </div>
    </div>

    <!-- Payments -->
    ${totalCount > 0 ? `
      <div class="section-title animate-in">Платежи за месяц</div>
      <div class="glass-card animate-in">
        <div class="progress-bar-container">
          <div class="progress-bar-label">
            <span>${paidCount} из ${totalCount} оплачено</span>
            <span>${paidPercent}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${paidPercent === 100 ? 'success' : ''}" style="width: ${paidPercent}%"></div>
          </div>
        </div>

        <div class="mt-md">
          ${s.payments.map(p => `
            <div class="payment-item">
              <div class="payment-icon ${p.icon}">${getIcon(p.icon)}</div>
              <div class="payment-details">
                <div class="payment-name">${p.name}</div>
                <div class="payment-meta">${p.dueDay}-е число</div>
              </div>
              <div class="payment-right">
                <div class="payment-amount">${formatMoney(p.amount)} ${p.currency === 'USD' ? 'USD' : cur}</div>
                <span class="payment-status ${p.paid ? 'paid' : 'pending'}">${p.paid ? '✓ Оплачен' : 'Ожидает'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div class="empty-state animate-in">
        <div class="empty-state-text">Добавьте платежи во вкладке «Платежи»</div>
      </div>
    `}

    <!-- Remainder -->
    <div class="section-title animate-in">Свободные средства</div>
    <div class="glass-card mom-card animate-in">
      <div class="balance-label">Остаток после всех платежей</div>
      <div class="mom-amount">${formatMoney(store.remainderForMom)} ${cur}</div>
    </div>

    <!-- Recent Expenses -->
    ${recentExpenses.length > 0 ? `
      <div class="section-title animate-in">Последние операции</div>
      <div class="glass-card animate-in" style="padding: var(--space-sm) 0;">
        ${recentExpenses.map(e => {
          const d = new Date(e.date);
          const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          return `
            <div class="expense-item">
              <div class="expense-dot ${e.type}"></div>
              <div class="expense-desc">${e.description}</div>
              <div class="expense-time">${time}</div>
              <div class="expense-amount ${e.type}">${e.type === 'incoming' ? '+' : '−'}${formatMoney(e.amount)} ${cur}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
  `;
}

function renderSetup(cur) {
  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; padding: var(--space-lg);">
      <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: var(--space-sm);">Добро пожаловать</h2>
      <p style="color: var(--clr-text-secondary); font-size: 0.85rem; margin-bottom: var(--space-xl);">
        Укажите сумму ежемесячного дохода и дату его поступления.
      </p>

      <div style="width: 100%; max-width: 320px;">
        <div class="form-group">
          <label class="form-label">Ежемесячный доход (${cur})</label>
          <input class="form-input" id="setup-amount" type="number" inputmode="numeric" placeholder="3000000" style="font-size: 1.2rem; text-align: center;" />
        </div>
        <div class="form-group">
          <label class="form-label">День поступления (1–31)</label>
          <select class="form-input" id="setup-day" style="text-align: center;">
            ${Array.from({length: 31}, (_, i) => `<option value="${i+1}" ${i+1 === 5 ? 'selected' : ''}>${i+1}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary btn-full" id="setup-btn" style="margin-top: var(--space-md); padding: var(--space-md);">
          Начать
        </button>
      </div>
    </div>
  `;
}

export function mountDashboard() {
  const cur = store.state.currency || 'сўм';

  // Setup flow
  const setupBtn = document.getElementById('setup-btn');
  if (setupBtn) {
    setupBtn.addEventListener('click', () => {
      const amount = Number(document.getElementById('setup-amount').value);
      const day = Number(document.getElementById('setup-day').value);
      if (!amount || amount <= 0) {
        showToast('Введите сумму дохода', 'error');
        return;
      }
      const clampedDay = Math.max(1, Math.min(31, day || 5));
      store.completeSetup(amount, clampedDay);
      window.location.hash = '#payments';
    });
  }

  // Edit income from dashboard
  document.getElementById('edit-income-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Размер дохода</div>
      <div class="form-group">
        <label class="form-label">Сумма (${cur})</label>
        <input class="form-input" id="modal-income-input" type="number" inputmode="numeric" value="${store.state.pensionAmount}" />
      </div>
      <button class="btn btn-primary btn-full" id="modal-save-income">Сохранить</button>
    `);
    document.getElementById('modal-save-income').addEventListener('click', () => {
      const val = Number(document.getElementById('modal-income-input').value);
      if (val > 0) {
        store.setPensionAmount(val);
        showToast('Доход обновлён', 'success');
      }
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });
}

