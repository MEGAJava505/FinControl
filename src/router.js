// ============================================
// FinControl — Simple Hash Router
// ============================================

class Router {
  constructor() {
    this._routes = {};
    this._currentPage = null;
    this._container = null;
    window.addEventListener('hashchange', () => this._onHashChange());
  }

  init(containerId) {
    this._container = document.getElementById(containerId);
    this._onHashChange();
  }

  register(name, renderFn) {
    this._routes[name] = renderFn;
  }

  navigate(page) {
    window.location.hash = '#' + page;
  }

  get currentPage() {
    return this._currentPage;
  }

  _onHashChange() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    this._currentPage = hash;

    if (this._routes[hash] && this._container) {
      // Fade out
      this._container.style.opacity = '0';
      this._container.style.transform = 'translateY(8px)';

      setTimeout(() => {
        this._container.innerHTML = this._routes[hash]();
        this._container.style.opacity = '1';
        this._container.style.transform = 'translateY(0)';

        // Update nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.page === hash);
        });

        // Trigger page mount callback
        if (this._mountCallbacks[hash]) {
          this._mountCallbacks[hash]();
        }
      }, 150);
    }
  }

  _mountCallbacks = {};

  onMount(page, callback) {
    this._mountCallbacks[page] = callback;
  }
}

export const router = new Router();
