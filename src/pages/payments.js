// ============================================
// FinControl — Payments Page
// Category selection + custom creation
// ============================================
import { store } from '../financeStore.js';
import { getIcon, CATEGORIES } from '../icons.js';
import { showModal, showToast } from '../ui.js';

const formatMoney = (n) => {
  const num = Number(n) || 0;
  const isInt = num % 1 === 0;
  const [int, dec] = num.toFixed(isInt ? 0 : 2).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? '.' + dec : '');
};

export function renderPayments() {
  const s = store.state;
  const cur = s.currency || 'сўм';

  if (!store.isSetupDone) {
    return `<div class="empty-state"><div class="empty-state-text">Сначала настройте доход на главной странице</div></div>`;
  }

  return `
    <div class="flex-between animate-in">
      <h2 style="font-size: 1.1rem; font-weight: 700;">Платежи</h2>
      <button class="btn btn-primary btn-sm" id="add-payment-btn">+ Добавить</button>
    </div>

    <!-- Distribution bar -->
    <div class="glass-card animate-in" style="margin-top: var(--space-md);">
      <div class="flex-between" style="margin-bottom: var(--space-xs);">
        <span style="font-size: 0.75rem; color: var(--clr-text-secondary);">Распределено</span>
        <span style="font-size: 0.75rem; color: var(--clr-text-secondary);">${formatMoney(store.distributed)} / ${formatMoney(s.pensionAmount)} ${cur}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill ${store.distributed > s.pensionAmount ? 'danger' : ''}" style="width: ${Math.min(100, s.pensionAmount > 0 ? (store.distributed / s.pensionAmount) * 100 : 0)}%"></div>
      </div>
      ${store.unallocated > 0 ? `<div style="font-size: 0.72rem; color: var(--clr-text-muted); margin-top: 4px;">Свободно: ${formatMoney(store.unallocated)} ${cur}</div>` : ''}
    </div>

    ${s.payments.length === 0 ? `
      <div class="empty-state animate-in" style="padding: var(--space-xl);">
        <div style="width: 48px; height: 48px; margin: 0 auto var(--space-md); opacity: 0.2;">${getIcon('plus')}</div>
        <div class="empty-state-text">Нажмите «+ Добавить», чтобы выбрать категории платежей и распределить деньги</div>
      </div>
    ` : `
      <div class="mt-md">
        ${s.payments.map(p => `
          <div class="payment-item animate-in" data-payment-id="${p.id}">
            <div class="payment-icon ${p.icon}">${getIcon(p.icon)}</div>
            <div class="payment-details">
              <div class="payment-name">${p.name}</div>
              <div class="payment-meta">
                ${p.dueDay}-е число${p.url ? ' · →' : ''}
                ${p.comment ? `
                  <div style="color: var(--clr-text-muted); font-size: 0.65rem; margin-top: 4px; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 4px 6px; border-radius: 4px;">
                    <span style="flex: 1; word-break: break-all;">${p.comment}</span>
                    <button class="btn-copy-comment" data-action="copy" data-val="${p.comment.replace(/"/g, '&quot;')}" style="background: none; border: none; color: var(--clr-primary-light); padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 8px;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
            <div class="payment-right">
              <div class="payment-amount">${formatMoney(p.amount)} ${p.currency === 'USD' ? 'USD' : cur}</div>
              ${p.paid
                ? `<button class="btn-pay done" data-action="unpay" data-id="${p.id}">✓ Оплачен</button>`
                : `<button class="btn-pay" data-action="pay" data-id="${p.id}">Оплатить</button>`
              }
            </div>
          </div>
        `).join('')}
      </div>

      <div class="glass-card animate-in mt-md">
        <div class="flex-between">
          <span style="color: var(--clr-text-secondary);">Всего</span>
          <span style="font-weight: 700;">${formatMoney(store.totalMandatory)} ${cur}</span>
        </div>
        <div class="flex-between mt-sm">
          <span style="color: var(--clr-success);">Оплачено</span>
          <span style="font-weight: 700; color: var(--clr-success);">${formatMoney(store.totalPaid)} ${cur}</span>
        </div>
        <div class="flex-between mt-sm">
          <span style="color: var(--clr-warning);">Осталось</span>
          <span style="font-weight: 700; color: var(--clr-warning);">${formatMoney(store.totalUnpaid)} ${cur}</span>
        </div>
      </div>
    `}
  `;
}

export function mountPayments() {
  const cur = store.state.currency || 'сўм';

  // Pay / Unpay
  document.querySelectorAll('[data-action="pay"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const payment = store.state.payments.find(p => p.id === id);

      if (payment && payment.url) {
        showModal(`
          <div class="modal-handle"></div>
          <div class="modal-title">Оплата: ${payment.name}</div>
          <p style="color: var(--clr-text-secondary); font-size: 0.85rem; margin-bottom: var(--space-md);">
            Сумма: <strong>${formatMoney(payment.amount)} ${payment.currency === 'USD' ? 'USD' : cur}</strong>
          </p>
          <div style="background: rgba(255,193,7,0.1); color: var(--clr-warning); padding: 10px; border-radius: 8px; font-size: 0.8rem; margin-bottom: var(--space-md);">
            Перепроверьте оплату по ссылке: Вы точно оплатили?
          </div>
          <button class="btn btn-primary btn-full mb-md" id="modal-open-url">1. Перейти к оплате</button>
          <button class="btn btn-secondary btn-full mb-md" id="modal-mark-paid" disabled>2. Отметить как оплачено (3)</button>
          <button class="btn btn-secondary btn-full" id="modal-cancel">Отмена</button>
        `);

        // Countdown logic
        let waitTime = 3;
        const markPaidBtn = document.getElementById('modal-mark-paid');
        const iv = setInterval(() => {
          waitTime--;
          if (!document.getElementById('modal-mark-paid')) {
             clearInterval(iv);
             return;
          }
          if (waitTime <= 0) {
            clearInterval(iv);
            markPaidBtn.disabled = false;
            markPaidBtn.textContent = '2. Отметить как оплачено ✓';
            markPaidBtn.style.background = 'var(--clr-success-bg)';
            markPaidBtn.style.color = 'var(--clr-success)';
          } else {
            markPaidBtn.textContent = `2. Отметить как оплачено (${waitTime})`;
          }
        }, 1000);

        document.getElementById('modal-open-url').addEventListener('click', () => {
          window.open(payment.url, '_blank');
        });
        document.getElementById('modal-mark-paid').addEventListener('click', () => {
          store.markPaid(id);
          showToast('Платёж отмечен', 'success');
          closeModal();
        });
        document.getElementById('modal-cancel').addEventListener('click', closeModal);
      } else {
        store.markPaid(id);
        showToast(`${payment.name} — оплачен`, 'success');
      }
    });
  });

  document.querySelectorAll('[data-action="unpay"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.markUnpaid(btn.dataset.id);
      showToast('Платёж отменён', 'error');
    });
  });

  // Copy comment
  document.querySelectorAll('.btn-copy-comment').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.dataset.val;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(val).then(() => {
          showToast('Скопировано', 'success');
        }).catch(err => {
          showToast('Не удалось скопировать', 'error');
        });
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = val;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          showToast('Скопировано', 'success');
        } catch (err) {
          showToast('Не удалось скопировать', 'error');
        }
        document.body.removeChild(textArea);
      }
    });
  });

  // Edit payment on tap
  document.querySelectorAll('.payment-item[data-payment-id]').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.paymentId;
      const p = store.state.payments.find(x => x.id === id);
      if (!p) return;

      showModal(`
        <div class="modal-handle"></div>
        <div class="modal-title">Редактировать</div>
        <div class="form-group">
          <label class="form-label">Название</label>
          <input class="form-input" id="edit-name" value="${p.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Сумма</label>
          <div style="display: flex; gap: var(--space-xs);">
            <input class="form-input" id="edit-amount" type="number" value="${p.amount}" inputmode="numeric" style="flex: 1;" />
            <select class="form-input" id="edit-currency" style="width: auto;">
              <option value="UZS" ${p.currency === 'UZS' || !p.currency ? 'selected' : ''}>${cur}</option>
              <option value="USD" ${p.currency === 'USD' ? 'selected' : ''}>USD</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">День списания</label>
          <input class="form-input" id="edit-day" type="number" min="1" max="31" value="${p.dueDay}" inputmode="numeric" />
        </div>
        <div class="form-group">
          <label class="form-label">URL для оплаты</label>
          <input class="form-input" id="edit-url" value="${p.url || ''}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Ключевые слова (для авто-оплаты)</label>
          <input class="form-input" id="edit-keywords" value="${p.keywords || ''}" placeholder="YANDEX, NETFLIX, UCELL..." />
        </div>
        <div class="form-group">
          <label class="form-label">Комментарий</label>
          <input class="form-input" id="edit-comment" value="${p.comment || ''}" placeholder="Логин, пароль или заметки..." />
        </div>
        <button class="btn btn-primary btn-full mb-md" id="modal-save-payment">Сохранить</button>
        <button class="btn btn-danger btn-full" id="modal-delete-payment">Удалить</button>
      `);

      document.getElementById('modal-save-payment').addEventListener('click', () => {
        store.updatePayment(id, {
          name: document.getElementById('edit-name').value,
          amount: Number(document.getElementById('edit-amount').value),
          currency: document.getElementById('edit-currency').value,
          dueDay: Number(document.getElementById('edit-day').value),
          url: document.getElementById('edit-url').value,
          keywords: document.getElementById('edit-keywords').value,
          comment: document.getElementById('edit-comment').value,
        });
        showToast('Сохранено', 'success');
        closeModal();
      });

      document.getElementById('modal-delete-payment').addEventListener('click', () => {
        store.removePayment(id);
        showToast('Удалено', 'error');
        closeModal();
      });
    });
  });

  // Add payment — show category picker
  const addBtn = document.getElementById('add-payment-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      showCategoryPicker(cur);
    });
  }
}

function showCategoryPicker(cur) {
  // Group categories
  const groups = {};
  CATEGORIES.forEach(cat => {
    if (!groups[cat.group]) groups[cat.group] = [];
    groups[cat.group].push(cat);
  });

  const categoryGrid = Object.entries(groups).map(([groupName, cats]) => `
    <div style="margin-bottom: var(--space-md);">
      <div style="font-size: 0.72rem; color: var(--clr-text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--space-xs);">${groupName}</div>
      <div class="category-grid">
        ${cats.map(cat => `
          <button class="category-pick-btn" data-cat-id="${cat.id}" data-cat-name="${cat.name}">
            <span class="category-pick-icon">${getIcon(cat.id)}</span>
            <span class="category-pick-label">${cat.name}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');

  showModal(`
    <div class="modal-handle"></div>
    <div class="modal-title">Выберите категорию</div>
    ${categoryGrid}
    <div style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--border-glass);">
      <button class="btn btn-secondary btn-full" id="create-custom-cat">Создать свою категорию</button>
    </div>
  `);

  // Category pick handler
  document.querySelectorAll('.category-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.catId;
      const catName = btn.dataset.catName;
      showAmountInput(catId, catName, cur);
    });
  });

  // Custom category
  document.getElementById('create-custom-cat')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Своя категория</div>
      <div class="form-group">
        <label class="form-label">Название</label>
        <input class="form-input" id="custom-cat-name" placeholder="Например: Кредит, Spotify..." />
      </div>
      <div class="form-group">
        <label class="form-label">Сумма</label>
        <div style="display: flex; gap: var(--space-xs);">
          <input class="form-input" id="custom-cat-amount" type="number" inputmode="numeric" />
          <select class="form-input" id="custom-cat-currency" style="width: auto;">
            <option value="UZS">${cur}</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">День списания</label>
        <input class="form-input" id="custom-cat-day" type="number" min="1" max="31" value="${store.state.pensionDay}" inputmode="numeric" />
      </div>
      <div class="form-group">
        <label class="form-label">URL для оплаты (необязательно)</label>
        <input class="form-input" id="custom-cat-url" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label class="form-label">Ключевые слова (для авто-оплаты)</label>
        <input class="form-input" id="custom-cat-keywords" placeholder="YANDEX, NETFLIX..." />
      </div>
      <div class="form-group">
        <label class="form-label">Комментарий</label>
        <input class="form-input" id="custom-cat-comment" placeholder="Логин, пароль или заметки..." />
      </div>
      <button class="btn btn-primary btn-full" id="save-custom-cat">Добавить</button>
    `);

    document.getElementById('save-custom-cat')?.addEventListener('click', () => {
      const name = document.getElementById('custom-cat-name').value.trim();
      const amount = Number(document.getElementById('custom-cat-amount').value);
      if (!name) return showToast('Введите название', 'error');
      store.addPayment({ 
        name, 
        amount, 
        currency: document.getElementById('custom-cat-currency').value,
        dueDay: document.getElementById('custom-cat-day').value,
        icon: 'custom', 
        url: document.getElementById('custom-cat-url').value,
        keywords: document.getElementById('custom-cat-keywords').value,
        comment: document.getElementById('custom-cat-comment').value,
      });
      showToast('Добавлено', 'success');
      closeModal();
    });
  });
}

function showAmountInput(iconId, name, cur) {
  showModal(`
    <div class="modal-handle"></div>
    <div class="modal-title" style="display: flex; align-items: center; gap: var(--space-sm);">
      <span class="payment-icon ${iconId}" style="width: 32px; height: 32px;">${getIcon(iconId)}</span>
      ${name}
    </div>
    <div class="form-group">
      <label class="form-label">Название</label>
      <input class="form-input" id="new-pay-name" value="${name}" />
    </div>
    <div class="form-group">
      <label class="form-label">Сумма</label>
      <div style="display: flex; gap: var(--space-xs);">
        <input class="form-input" id="new-pay-amount" type="number" inputmode="numeric" autofocus />
        <select class="form-input" id="new-pay-currency" style="width: auto;">
          <option value="UZS">${cur}</option>
          <option value="USD">USD</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">День списания</label>
      <input class="form-input" id="new-pay-day" type="number" min="1" max="31" value="${store.state.pensionDay}" inputmode="numeric" />
    </div>
    <div class="form-group">
      <label class="form-label">URL для оплаты (необязательно)</label>
      <input class="form-input" id="new-pay-url" placeholder="https://..." />
    </div>
    <div class="form-group">
      <label class="form-label">Ключевые слова (через запятую)</label>
      <input class="form-input" id="new-pay-keywords" placeholder="YANDEX, NETFLIX..." />
    </div>
    <div class="form-group">
      <label class="form-label">Комментарий</label>
      <input class="form-input" id="new-pay-comment" placeholder="Логин, пароль или заметки..." />
    </div>
    <button class="btn btn-primary btn-full" id="save-new-payment">Добавить</button>
  `);

  document.getElementById('save-new-payment')?.addEventListener('click', () => {
    const payName = document.getElementById('new-pay-name').value.trim() || name;
    const amount = Number(document.getElementById('new-pay-amount').value);
    store.addPayment({ 
      name: payName, 
      amount, 
      currency: document.getElementById('new-pay-currency').value,
      dueDay: document.getElementById('new-pay-day').value,
      icon: iconId, 
      url: document.getElementById('new-pay-url').value,
      keywords: document.getElementById('new-pay-keywords').value,
      comment: document.getElementById('new-pay-comment').value,
    });
    showToast('Добавлено', 'success');
    closeModal();
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}
