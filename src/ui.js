// ============================================
// FinControl — UI Helpers (Modal + Toast)
// ============================================

export function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = html;
  overlay.classList.remove('hidden');

  // Close on backdrop click
  const fn = (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      overlay.removeEventListener('click', fn);
    }
  };
  // Remove any old listener if we re-used the overlay without closing properly
  overlay.replaceWith(overlay.cloneNode(true));
  const newOverlay = document.getElementById('modal-overlay');
  newOverlay.addEventListener('click', (e) => {
    if (e.target === newOverlay) {
      newOverlay.classList.add('hidden');
    }
  });
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

export function showToast(message, type = 'success') {
  // Remove existing
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}
