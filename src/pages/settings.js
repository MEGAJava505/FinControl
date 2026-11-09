// ============================================
// FinControl — Settings Page
// ============================================
import { store } from '../financeStore.js';
import { showModal, showToast } from '../ui.js';
import { requestNotificationPermission } from '../notificationParser.js';

const formatMoney = (n) => {
  const num = Number(n) || 0;
  const isInt = num % 1 === 0;
  const [int, dec] = num.toFixed(isInt ? 0 : 2).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? '.' + dec : '');
};

export function renderSettings() {
  const s = store.state;
  const cur = s.currency || 'сўм';

  return `
    <h2 class="animate-in" style="font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-lg);">Настройки</h2>

    <!-- Pension Settings -->
    <div class="section-title animate-in">Доход</div>
    <div class="glass-card animate-in">
      <div class="setting-row">
        <div>
          <div class="setting-label">Размер дохода</div>
          <div class="setting-desc">${formatMoney(s.pensionAmount)} ${cur} / мес</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="edit-pension-btn">Изменить</button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">День зачисления</div>
          <div class="setting-desc">${s.pensionDay}-е число каждого месяца</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="edit-pension-day-btn">Изменить</button>
      </div>
    </div>

    <!-- Balance -->
    <div class="section-title animate-in">Баланс и Валюта</div>
    <div class="glass-card animate-in">
      <div class="setting-row">
        <div>
          <div class="setting-label">Курс доллара</div>
          <div class="setting-desc">1 USD = ${formatMoney(s.usdRate || 12600)} ${cur}</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="edit-usd-btn">Изменить</button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Текущий баланс</div>
          <div class="setting-desc">${formatMoney(store.totalBalance)} ${cur}</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="set-balance-btn">Задать</button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Источник баланса</div>
          <div class="setting-desc">${s.balanceSyncMode === 'all' ? 'Сумма всех карт' : (s.balanceSyncMode === 'first' ? 'Первая карта' : 'Вручную')}</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="set-balance-mode-btn">Выбрать</button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Добавить приход</div>
          <div class="setting-desc">Ручное добавление денег</div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-income-btn">+ Приход</button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Добавить расход</div>
          <div class="setting-desc">Ручное списание</div>
        </div>
        <button class="btn btn-sm" id="add-expense-btn" style="background: var(--clr-danger-bg); color: var(--clr-danger);">− Расход</button>
      </div>
    </div>

    <!-- Simulation -->
    <div class="section-title animate-in">Симуляция</div>
    <div class="glass-card animate-in">
      <div class="setting-row">
        <div>
          <div class="setting-label">Зачислить доход</div>
          <div class="setting-desc">Симулировать поступление ${formatMoney(s.pensionAmount)} ${cur}</div>
        </div>
        <button class="btn btn-sm" id="sim-pension-btn" style="background: var(--clr-success-bg); color: var(--clr-success);">Зачислить</button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Доступ к уведомлениям (Android)</div>
          <div class="setting-desc">Нужно для автоматического чтения расходов из банков</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="req-notif-btn">Разрешить</button>
      </div>
    </div>

    <!-- Cloud Sync -->
    <div class="section-title animate-in" style="color: var(--clr-primary);">Облачная база</div>
    <div class="glass-card animate-in">
      <div class="setting-row">
        <div>
          <div class="setting-label">Принудительная синхронизация</div>
          <div class="setting-desc">Авто-сохранение уже работает в фоне</div>
        </div>
        <button class="btn btn-primary btn-sm" id="force-sync-btn">Синхронизировать</button>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="section-title animate-in" style="color: var(--clr-danger);">Опасная зона</div>
    <div class="glass-card animate-in" style="border-color: rgba(239, 68, 68, 0.15);">
      <div class="setting-row">
        <div>
          <div class="setting-label">Сбросить месяц</div>
          <div class="setting-desc">Обнулить все статусы платежей</div>
        </div>
        <button class="btn btn-danger btn-sm" id="reset-month-btn">Сброс</button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">Сбросить всё</div>
          <div class="setting-desc">Удалить все данные приложения</div>
        </div>
        <button class="btn btn-danger btn-sm" id="reset-all-btn">Удалить</button>
      </div>
    </div>

    <!-- Debug Section -->
    <div class="section-title animate-in">Отладка СМС</div>
    <div class="glass-card animate-in">
      <div class="setting-row">
        <div>
          <div class="setting-label">Режим отладки</div>
          <div class="setting-desc">Показывать всплывающие уведомления на все СМС</div>
        </div>
        <div class="toggle-container">
           <input type="checkbox" id="debug-toggle" ${s.debugMode ? 'checked' : ''} />
        </div>
      </div>
      <div class="mt-md" id="debug-last-notif" style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; font-family: monospace; font-size: 0.7rem; color: var(--clr-success);">
        ${s.lastNotification ? `Последнее (${s.lastNotification.time}): [${s.lastNotification.title}] ${s.lastNotification.text}` : 'Уведомлений пока не было...'}
      </div>
    </div>

    <!-- App version -->
    <div class="text-center mt-lg animate-in" style="color: var(--clr-text-muted); font-size: 0.72rem;">
      FinControl v1.2.7
    </div>
  `;
}

export function mountSettings() {
  const cur = store.state.currency || 'сўм';
  // Edit pension amount
  document.getElementById('edit-pension-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Размер дохода</div>
      <div class="form-group">
        <label class="form-label">Сумма (${cur})</label>
        <input class="form-input" id="pension-input" type="number" inputmode="numeric" value="${store.state.pensionAmount}" />
      </div>
      <button class="btn btn-primary btn-full" id="modal-save-pension">Сохранить</button>
    `);
    document.getElementById('modal-save-pension').addEventListener('click', () => {
      store.setPensionAmount(document.getElementById('pension-input').value);
      showToast('Доход обновлён', 'success');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });

  // Edit pension day
  document.getElementById('edit-pension-day-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">День зачисления</div>
      <div class="form-group">
        <label class="form-label">День месяца (1-31)</label>
        <input class="form-input" id="pension-day-input" type="number" min="1" max="31" inputmode="numeric" value="${store.state.pensionDay}" />
      </div>
      <button class="btn btn-primary btn-full" id="modal-save-day">Сохранить</button>
    `);
    document.getElementById('modal-save-day').addEventListener('click', () => {
      store.state.pensionDay = Number(document.getElementById('pension-day-input').value) || 5;
      localStorage.setItem('fincontrol_data', JSON.stringify(store.state));
      showToast('День обновлён ✓', 'success');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });
  // Edit USD Rate
  document.getElementById('edit-usd-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Курс доллара</div>
      <div class="form-group">
        <label class="form-label">Курс (1 USD в Сўмах)</label>
        <input class="form-input" id="usd-rate-input" type="number" inputmode="numeric" value="${store.state.usdRate || 12600}" />
      </div>
      <p style="font-size: 0.75rem; color: var(--clr-text-secondary); margin-bottom: var(--space-md);">Курс обновляется автоматически из ЦБ РУз при запуске.</p>
      <button class="btn btn-primary btn-full" id="modal-save-usd">Сохранить</button>
    `);
    document.getElementById('modal-save-usd').addEventListener('click', () => {
      store.setUsdRate(document.getElementById('usd-rate-input').value);
      showToast('Курс обновлён ✓', 'success');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });

  // Set balance
  document.getElementById('set-balance-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Задать баланс</div>
      <div class="form-group">
        <label class="form-label">Текущий баланс (сўм)</label>
        <input class="form-input" id="balance-input" type="number" inputmode="numeric" value="${store.state.currentBalance}" />
      </div>
      <div style="font-size: 0.75rem; color: var(--clr-text-secondary); margin-bottom: var(--space-md);">
        Имеет эффект только если источник баланса выбран "Вручную".
      </div>
      <button class="btn btn-primary btn-full" id="modal-save-balance">Сохранить</button>
    `);
    document.getElementById('modal-save-balance').addEventListener('click', () => {
      store.setBalance(document.getElementById('balance-input').value);
      showToast('Баланс обновлён ✓', 'success');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });

  // Set balance sync mode
  document.getElementById('set-balance-mode-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Источник баланса</div>
      <div class="form-group">
        <label class="form-label">Откуда брать главный баланс?</label>
        <select class="form-input" id="balance-mode-input">
          <option value="manual" ${store.state.balanceSyncMode === 'manual' ? 'selected' : ''}>Вручную (отдельно от карт)</option>
          <option value="all" ${store.state.balanceSyncMode === 'all' ? 'selected' : ''}>Сумма всех карт</option>
          <option value="first" ${store.state.balanceSyncMode === 'first' ? 'selected' : ''}>Только первая карта</option>
        </select>
      </div>
      <button class="btn btn-primary btn-full" id="modal-save-balance-mode">Ок</button>
    `);
    document.getElementById('modal-save-balance-mode').addEventListener('click', () => {
      store.setBalanceSyncMode(document.getElementById('balance-mode-input').value);
      showToast('Настройки баланса обновлены ✓', 'success');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });

  // Add income
  document.getElementById('add-income-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Добавить приход</div>
      <div class="form-group">
        <label class="form-label">Описание</label>
        <input class="form-input" id="income-desc" placeholder="Зарплата, подработка..." />
      </div>
      <div class="form-group">
        <label class="form-label">Сумма (${cur})</label>
        <input class="form-input" id="income-amount" type="number" inputmode="numeric" placeholder="5000" />
      </div>
      <button class="btn btn-primary btn-full" id="modal-save-income">Добавить</button>
    `);
    document.getElementById('modal-save-income').addEventListener('click', () => {
      const desc = document.getElementById('income-desc').value.trim() || 'Приход';
      const amount = Number(document.getElementById('income-amount').value);
      if (!amount) return showToast('Введите сумму', 'error');
      store.addIncome(desc, amount);
      showToast(`+${formatMoney(amount)} ${cur} ✓`, 'success');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });

  // Add expense
  document.getElementById('add-expense-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Добавить расход</div>
      <div class="form-group">
        <label class="form-label">Описание</label>
        <input class="form-input" id="expense-desc" placeholder="Продукты, такси..." />
      </div>
      <div class="form-group">
        <label class="form-label">Сумма (${cur})</label>
        <input class="form-input" id="expense-amount" type="number" inputmode="numeric" placeholder="500" />
      </div>
      <button class="btn btn-primary btn-full" id="modal-save-expense">Добавить расход</button>
    `);
    document.getElementById('modal-save-expense').addEventListener('click', () => {
      const desc = document.getElementById('expense-desc').value.trim() || 'Расход';
      const amount = Number(document.getElementById('expense-amount').value);
      if (!amount) return showToast('Введите сумму', 'error');
      store.addExpense(desc, amount);
      showToast(`−${formatMoney(amount)} ${cur}`, 'error');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });

  // Simulate pension
  document.getElementById('sim-pension-btn')?.addEventListener('click', () => {
    store.simulatePension();
    showToast(`Доход +${formatMoney(store.state.pensionAmount)} ${cur} зачислен`, 'success');
  });

  // Request Android Notifications
  document.getElementById('req-notif-btn')?.addEventListener('click', async () => {
    try {
      const result = await requestNotificationPermission();
      if (result === 'granted') {
        showToast('Уже разрешено (FinControl читает СМС)', 'success');
      } else {
        showToast('Включите галочку для FinControl и вернитесь назад', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast(e.message || 'Ошибка плагина', 'error');
    }
  });

  // Force sync
  document.getElementById('force-sync-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('force-sync-btn');
    const oldText = btn.innerText;
    btn.innerText = 'Загрузка...';
    btn.disabled = true;
    try {
      await store.forceSync();
      showToast('Успешно синхронизировано', 'success');
    } catch (e) {
      showToast('Ошибка синхронизации', 'error');
    } finally {
      btn.innerText = oldText;
      btn.disabled = false;
    }
  });

  // Debug toggle
  document.getElementById('debug-toggle')?.addEventListener('change', (e) => {
    store.setDebugMode(e.target.checked);
    showToast(e.target.checked ? 'Режим отладки включен' : 'Режим отладки выключен', 'info');
  });

  // Reset month
  document.getElementById('reset-month-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title">Сброс месяца</div>
      <p style="color: var(--clr-text-secondary); font-size: 0.85rem; margin-bottom: var(--space-lg);">
        Все статусы платежей будут сброшены. Баланс не изменится. Продолжить?
      </p>
      <button class="btn btn-danger btn-full mb-md" id="modal-confirm-reset">Да, сбросить</button>
      <button class="btn btn-secondary btn-full" id="modal-cancel-reset">Отмена</button>
    `);
    document.getElementById('modal-confirm-reset').addEventListener('click', () => {
      store.resetMonth();
      showToast('Месяц сброшен', 'success');
      document.getElementById('modal-overlay').classList.add('hidden');
    });
    document.getElementById('modal-cancel-reset').addEventListener('click', () => {
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });

  // Reset all
  document.getElementById('reset-all-btn')?.addEventListener('click', () => {
    showModal(`
      <div class="modal-handle"></div>
      <div class="modal-title" style="color: var(--clr-danger);">Удалить все данные</div>
      <p style="color: var(--clr-text-secondary); font-size: 0.85rem; margin-bottom: var(--space-lg);">
        Все платежи, карты, транзакции и настройки будут удалены безвозвратно. Продолжить?
      </p>
      <button class="btn btn-danger btn-full mb-md" id="modal-confirm-nuke">Удалить ВСЁ</button>
      <button class="btn btn-secondary btn-full" id="modal-cancel-nuke">Отмена</button>
    `);
    document.getElementById('modal-confirm-nuke').addEventListener('click', () => {
      localStorage.removeItem('fincontrol_data');
      showToast('Все данные удалены', 'error');
      document.getElementById('modal-overlay').classList.add('hidden');
      setTimeout(() => location.reload(), 500);
    });
    document.getElementById('modal-cancel-nuke').addEventListener('click', () => {
      document.getElementById('modal-overlay').classList.add('hidden');
    });
  });
}
