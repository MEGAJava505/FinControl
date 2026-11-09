// ============================================
// FinControl — Cards Page
// ============================================
import { store } from '../financeStore.js';
import { showModal, showToast } from '../ui.js';

const formatMoney = (n) => {
  const num = Number(n) || 0;
  const isInt = num % 1 === 0;
  const [int, dec] = num.toFixed(isInt ? 0 : 2).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? '.' + dec : '');
};

export function renderCards() {
  const cards = store.state.cards;
  const cur = store.state.currency || 'сўм';

  return `
    <div class="flex-between animate-in">
      <h2 style="font-size: 1.1rem; font-weight: 700;">Мои карты</h2>
      <button class="btn btn-primary btn-sm" id="add-card-btn">+ Добавить</button>
    </div>

    ${cards.length === 0 ? `
      <div class="empty-state animate-in">
        <div class="empty-state-icon" style="font-size: 2rem; opacity: 0.3;">—</div>
        <div class="empty-state-text">Добавьте банковские карты для отслеживания баланса по каждой карте отдельно</div>
      </div>
    ` : `
      <div class="mt-md">
        ${cards.map(card => `
          <div class="card-profile ${card.system} animate-in" data-card-id="${card.id}">
            <div class="card-header-flex">
              <div class="card-chip"></div>
              <div class="card-system-logo ${card.system}">${card.system.toUpperCase()}</div>
            </div>
            <div class="card-bottom-flex">
              <div class="card-info">
                <div class="card-number">•••• ${card.lastFour}</div>
                <div class="card-bank-name">${card.bankName || ('Карта ' + card.lastFour)}</div>
              </div>
              <div class="card-balance">
                <div class="card-balance-label">Баланс</div>
                <div class="card-balance-amount">${formatMoney(card.balance)}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="glass-card animate-in mt-md">
        <div class="flex-between">
          <span style="color: var(--clr-text-secondary);">Общий баланс по картам</span>
          <span style="font-weight: 700;">${formatMoney(cards.reduce((s, c) => s + c.balance, 0))} ${cur}</span>
        </div>
      </div>
    `}

    <div class="section-title animate-in">Как это работает</div>
    <div class="glass-card animate-in">
      <p style="font-size: 0.82rem; color: var(--clr-text-secondary); line-height: 1.5;">
        Добавьте свои карты (последние 4 цифры).<br>
        Когда придёт уведомление от банка, приложение автоматически определит, с какой карты было списание, и обновит баланс.<br>
        Нажмите на карту для редактирования.
      </p>
    </div>
  `;
}

export function mountCards() {
  // Add card
  const addBtn = document.getElementById('add-card-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showModal(`
        <div class="modal-handle"></div>
        <div class="modal-title">Новая карта</div>
        <div class="form-group">
          <label class="form-label">Платежная система</label>
          <select class="form-input" id="card-system">
            <option value="uzcard">Uzcard</option>
            <option value="humo">Humo</option>
            <option value="visa">Visa</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Последние 4 цифры (для авто-обновления)</label>
          <input class="form-input" id="card-last4" maxlength="4" inputmode="numeric" placeholder="1234" />
        </div>
        <div class="form-group">
          <label class="form-label">Текущий баланс (сўм)</label>
          <input class="form-input" id="card-balance" type="number" inputmode="numeric" placeholder="50000" />
        </div>
        <button class="btn btn-primary btn-full" id="modal-save-card">Добавить карту</button>
      `);

      document.getElementById('modal-save-card').addEventListener('click', () => {
        const lastFour = document.getElementById('card-last4').value.trim();
        if (!lastFour) return showToast('Заполните поле с 4 цифрами', 'error');

        store.addCard({
          bankName: 'Карта ' + lastFour,
          system: document.getElementById('card-system').value,
          lastFour,
          balance: Number(document.getElementById('card-balance').value) || 0,
        });
        showToast('Карта добавлена ✓', 'success');
        document.getElementById('modal-overlay').classList.add('hidden');
      });
    });
  }

  // Edit card on tap
  document.querySelectorAll('.card-profile[data-card-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.cardId;
      const card = store.state.cards.find(c => c.id === id);
      if (!card) return;

      showModal(`
        <div class="modal-handle"></div>
        <div class="modal-title">Редактировать карту</div>
        <div class="form-group">
          <label class="form-label">Платежная система</label>
          <select class="form-input" id="edit-card-system">
            <option value="uzcard" ${card.system === 'uzcard' ? 'selected' : ''}>Uzcard</option>
            <option value="humo" ${card.system === 'humo' ? 'selected' : ''}>Humo</option>
            <option value="visa" ${card.system === 'visa' ? 'selected' : ''}>Visa</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Последние 4 цифры (для авто-обновления)</label>
          <input class="form-input" id="edit-card-last4" maxlength="4" value="${card.lastFour}" inputmode="numeric" />
        </div>
        <div class="form-group">
          <label class="form-label">Текущий баланс (сўм)</label>
          <input class="form-input" id="edit-card-balance" type="number" value="${card.balance}" inputmode="numeric" />
        </div>
        <button class="btn btn-primary btn-full mb-md" id="modal-update-card">Сохранить</button>
        <button class="btn btn-danger btn-full" id="modal-remove-card">Удалить карту</button>
      `);

      document.getElementById('modal-update-card').addEventListener('click', () => {
        store.updateCard(id, {
          system: document.getElementById('edit-card-system').value,
          lastFour: document.getElementById('edit-card-last4').value.trim(),
          balance: Number(document.getElementById('edit-card-balance').value),
        });
        showToast('Карта обновлена ✓', 'success');
        document.getElementById('modal-overlay').classList.add('hidden');
      });

      document.getElementById('modal-remove-card').addEventListener('click', () => {
        store.removeCard(id);
        showToast('Карта удалена', 'error');
        document.getElementById('modal-overlay').classList.add('hidden');
      });
    });
  });
}
