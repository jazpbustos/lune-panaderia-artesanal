window.LuneProductos = (() => {
  const CATEGORIAS = {
    dulce: { label: 'Dulce', emoji: '🍰' },
    salado: { label: 'Salado', emoji: '🥖' },
    panes: { label: 'Panes', emoji: '🍞' },
    facturas: { label: 'Facturas', emoji: '🥐' },
    tortas: { label: 'Tortas', emoji: '🎂' },
    galletas: { label: 'Galletas', emoji: '🍪' },
    bizcochos: { label: 'Bizcochos', emoji: '🥨' },
        alfajores: { label: 'Alfajores', emoji: '🍰' }
  };

  const grid = document.querySelector('#productosGrid');
  const empty = document.querySelector('#productosEmpty');
  const filters = document.querySelectorAll('.filter-btn');
  const searchInput = document.querySelector('#productosSearch');
  const sortSelect = document.querySelector('#productosSort');
  const especialidadesGrid = document.querySelector('#especialidadesGrid');
  const especialidadesEmpty = document.querySelector('#especialidadesEmpty');
  const clearBtn = document.querySelector('#clearFilters');

  let productos = [];
  let estado = {
    categoria: 'all',
    search: '',
    sort: 'recent'
  };

  function formatPrice(value) {
    return Number(value || 0).toLocaleString('es-AR');
  }

  function normalize(text) {
    return (text || '').toString().toLowerCase().trim();
  }

  function getProductoCategorias(producto) {
    if (Array.isArray(producto.categorias) && producto.categorias.length) {
      return producto.categorias;
    }

    return producto.categoria ? [producto.categoria] : [];
  }

  function card(producto) {
    const categorias = getProductoCategorias(producto);
    const categoriaPrincipal = categorias[0] || producto.categoria;
    const categoria = CATEGORIAS[categoriaPrincipal] || {
      label: categoriaPrincipal || 'Producto',
      emoji: '🥖'
    };
    const categoriaLabel = categorias
      .map((value) => CATEGORIAS[value]?.label || value)
      .join(' / ');

    return `
      <article class="product-card" data-category="${categorias.join(' ')}">
        <div class="product-card__img">
          ${producto.imagen_url
            ? `<img src="${producto.imagen_url}" alt="${producto.titulo}">`
            : `<div class="product-card__img-placeholder">${categoria.emoji}</div>`}
          ${producto.destacado ? '<span class="product-card__badge">Especial</span>' : ''}
        </div>

        <div class="product-card__body">
          <p class="product-card__category">${categoriaLabel || categoria.label}</p>
          <h3 class="product-card__title">${producto.titulo}</h3>
          <p class="product-card__desc">${producto.descripcion || ''}</p>

          <div class="product-card__footer">
            <span class="product-card__price">$${formatPrice(producto.precio)}</span>
          </div>
        </div>
      </article>
    `;
  }

  function especialidad(producto) {
    const categoriaPrincipal = getProductoCategorias(producto)[0] || producto.categoria;
    const categoria = CATEGORIAS[categoriaPrincipal] || { emoji: '🥐' };

    return `
      <article class="especialidad-card">
        <div class="especialidad-card__img">
          ${producto.imagen_url
            ? `<img src="${producto.imagen_url}" alt="${producto.titulo}">`
            : `<div class="especialidad-card__img-placeholder">${categoria.emoji}</div>`}
        </div>

        <div>
          <p class="especialidad-card__tag">Producto destacado</p>
          <h3 class="especialidad-card__title">${producto.titulo}</h3>
          <p class="especialidad-card__desc">${producto.descripcion || ''}</p>
          <span class="especialidad-card__price">$${formatPrice(producto.precio)}</span>
        </div>
      </article>
    `;
  }

  function getFiltrados() {
    let result = [...productos];

    if (estado.categoria !== 'all') {
      result = result.filter((producto) => getProductoCategorias(producto).includes(estado.categoria));
    }

    if (estado.search) {
      const q = normalize(estado.search);
      result = result.filter((producto) =>
        normalize(producto.titulo).includes(q) ||
        normalize(producto.descripcion).includes(q)
      );
    }

    switch (estado.sort) {
      case 'price_asc':
        result.sort((a, b) => Number(a.precio) - Number(b.precio));
        break;
      case 'price_desc':
        result.sort((a, b) => Number(b.precio) - Number(a.precio));
        break;
      case 'name':
        result.sort((a, b) => normalize(a.titulo).localeCompare(normalize(b.titulo)));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return result;
  }

  function render() {
    if (!grid) return;

    const filtrados = getFiltrados();
    grid.innerHTML = '';

    if (!filtrados.length) {
      empty?.classList.remove('hidden');
      return;
    }

    empty?.classList.add('hidden');
    grid.innerHTML = filtrados.map(card).join('');
  }

  function renderEspecialidades() {
    if (!especialidadesGrid) return;

    const destacados = productos
      .filter((producto) => producto.destacado)
      .slice(0, 3);

    especialidadesGrid.innerHTML = '';

    if (!destacados.length) {
      especialidadesEmpty?.classList.remove('hidden');
      return;
    }

    especialidadesEmpty?.classList.add('hidden');
    especialidadesGrid.innerHTML = destacados.map(especialidad).join('');
  }

  function bindFilters() {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.forEach((item) => item.classList.remove('active'));
        btn.classList.add('active');
        estado.categoria = btn.dataset.filter || 'all';
        render();
      });
    });
  }

  function bindSearch() {
    searchInput?.addEventListener('input', (event) => {
      estado.search = event.target.value;
      render();
    });
  }

  function bindSort() {
    sortSelect?.addEventListener('change', (event) => {
      estado.sort = event.target.value;
      render();
    });
  }

  function clearFilters() {
    estado = {
      categoria: 'all',
      search: '',
      sort: 'recent'
    };

    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'recent';

    filters.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === 'all');
    });

    render();
  }

  function bindEvents() {
    bindFilters();
    bindSearch();
    bindSort();
    clearBtn?.addEventListener('click', clearFilters);
  }

  async function init() {
    const api = window.LuneSupabase;
    bindEvents();

    if (!api?.client) {
      console.warn('Supabase no inicializado');
      productos = [];
      render();
      renderEspecialidades();
      return;
    }

    if (grid) {
      grid.innerHTML = Array(6)
        .fill('<div class="product-card skeleton"></div>')
        .join('');
    }

    const { data, error } = await api.client
      .from(window.LUNE_CONFIG.productsTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando productos:', error.message);
      productos = [];
      render();
      renderEspecialidades();
      return;
    }

    productos = Array.isArray(data) ? data : [];
    render();
    renderEspecialidades();
  }

  return { init, render };
})();
