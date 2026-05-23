document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_EMAIL = 'admin@lunebakery.com';
  const CATEGORIAS = [
    { value: 'dulce', label: 'Dulce' },
    { value: 'salado', label: 'Salado' },
    { value: 'panes', label: 'Panes' },
    { value: 'facturas', label: 'Facturas' },
    { value: 'tortas', label: 'Tortas' },
    { value: 'galletas', label: 'Galletas' },
    { value: 'bizcochos', label: 'Bizcochos' },
        { value: 'alfajores', label: 'Alfajores' }
  ];

  const supabase = window.LuneSupabase?.client;
  const config = window.LUNE_CONFIG || {};

  const loginScreen = document.querySelector('#loginScreen');
  const dashboard = document.querySelector('#dashboard');
  const loginForm = document.querySelector('#loginForm');
  const loginEmail = document.querySelector('#loginEmail');
  const loginPassword = document.querySelector('#loginPassword');
  const loginError = document.querySelector('#loginError');
  const loginBtn = document.querySelector('#loginBtn');
  const logoutBtn = document.querySelector('#logoutBtn');
  const sidebarUser = document.querySelector('#sidebarUser');

  const sidebarLinks = document.querySelectorAll('.sidebar__link');
  const viewProductos = document.querySelector('#viewProductos');
  const viewFormulario = document.querySelector('#viewFormulario');
  const btnNuevoProducto = document.querySelector('#btnNuevoProducto');
  const btnCancelar = document.querySelector('#btnCancelar');
  const btnCancelar2 = document.querySelector('#btnCancelar2');

  const adminFiltroCategoria = document.querySelector('#adminFiltroCategoria');
  const adminBusqueda = document.querySelector('#adminBusqueda');
  const tableBody = document.querySelector('#adminTableBody');
  const tableLoading = document.querySelector('#adminTableLoading');
  const tableEmpty = document.querySelector('#adminTableEmpty');

  const productoForm = document.querySelector('#productoForm');
  const productoId = document.querySelector('#productoId');
  const pTitulo = document.querySelector('#pTitulo');
  const pPrecio = document.querySelector('#pPrecio');
  const pCategorias = document.querySelector('#pCategorias');
  const pDestacado = document.querySelector('#pDestacado');
  const pDescripcion = document.querySelector('#pDescripcion');
  const pImagenUrl = document.querySelector('#pImagenUrl');
  const imgUploader = document.querySelector('#imgUploader');
  const imgInput = document.querySelector('#imgInput');
  const imgPreview = document.querySelector('#imgPreview');
  const uploadProgress = document.querySelector('#uploadProgress');
  const uploadProgressText = document.querySelector('#uploadProgressText');
  const formError = document.querySelector('#formError');
  const formTitle = document.querySelector('#formTitle');
  const formSubtitle = document.querySelector('#formSubtitle');
  const saveBtn = document.querySelector('#saveBtn');
  const saveBtnText = document.querySelector('#saveBtnText');

  const deleteModal = document.querySelector('#deleteModal');
  const deleteCancelBtn = document.querySelector('#deleteCancelBtn');
  const deleteConfirmBtn = document.querySelector('#deleteConfirmBtn');
  const toastContainer = document.querySelector('#toastContainer');

  let productos = [];
  let productoAEliminar = null;
  let selectedFile = null;

  function formatPrice(value) {
    return Number(value || 0).toLocaleString('es-AR');
  }

  function getCategoriaLabel(value) {
    return CATEGORIAS.find((categoria) => categoria.value === value)?.label || value || '-';
  }

  function getProductoCategorias(producto) {
    if (Array.isArray(producto.categorias) && producto.categorias.length) {
      return producto.categorias;
    }

    return producto.categoria ? [producto.categoria] : [];
  }

  function getSelectedCategorias() {
    return pCategorias
      ? Array.from(pCategorias.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value)
      : [];
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function toast(message, type = 'success') {
    if (!toastContainer) return;

    const item = document.createElement('div');
    item.className = `toast toast--${type}`;
    item.textContent = message;
    toastContainer.appendChild(item);

    window.setTimeout(() => item.remove(), 3500);
  }

  function setLoginLoading(isLoading) {
    if (!loginBtn) return;
    loginBtn.disabled = isLoading;
    loginBtn.querySelector('span').textContent = isLoading ? 'Ingresando...' : 'Ingresar';
  }

  function showLoginError(message) {
    if (!loginError) return;
    loginError.textContent = message;
    loginError.classList.remove('hidden');
  }

  function clearLoginError() {
    loginError?.classList.add('hidden');
    if (loginError) loginError.textContent = '';
  }

  function showFormError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.classList.remove('hidden');
  }

  function clearFormError() {
    formError?.classList.add('hidden');
    if (formError) formError.textContent = '';
  }

  function showLogin() {
    loginScreen?.classList.remove('hidden');
    dashboard?.classList.add('hidden');
    if (loginPassword) loginPassword.value = '';
  }

  function setActiveSidebar(view) {
    sidebarLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.view === view);
    });
  }

  function showDashboard(email) {
    loginScreen?.classList.add('hidden');
    dashboard?.classList.remove('hidden');
    if (sidebarUser) sidebarUser.textContent = email || ADMIN_EMAIL;
    showForm(false);
    loadProductos();
  }

  function showForm(show) {
    viewProductos?.classList.toggle('hidden', show);
    viewFormulario?.classList.toggle('hidden', !show);
    setActiveSidebar(show ? 'nuevo' : 'productos');
  }

  function fillCategorySelects() {
    if (adminFiltroCategoria) {
      adminFiltroCategoria.innerHTML = [
        '<option value="all">Todas las categorias</option>',
        ...CATEGORIAS.map((categoria) => (
          `<option value="${categoria.value}">${categoria.label}</option>`
        ))
      ].join('');
    }

    if (pCategorias) {
      pCategorias.innerHTML = CATEGORIAS.map((categoria) => (
        `<label class="category-check">
          <input type="checkbox" value="${categoria.value}">
          <span>${categoria.label}</span>
        </label>`
      )).join('');
    }
  }

  function resetImagePreview() {
    selectedFile = null;
    if (imgInput) imgInput.value = '';
    if (pImagenUrl) pImagenUrl.value = '';
    if (uploadProgress) uploadProgress.classList.add('hidden');
    if (uploadProgressText) uploadProgressText.textContent = 'Subiendo...';
    if (imgPreview) {
      imgPreview.innerHTML = `
        <span class="img-placeholder-icon">📷</span>
        <span>Haz click o arrastra una imagen aquí</span>
        <span class="img-hint">JPG, PNG, WebP - máx. 5MB</span>
      `;
    }
  }

  function resetForm() {
    productoForm?.reset();
    if (productoId) productoId.value = '';
    resetImagePreview();
    clearFormError();
    if (formTitle) formTitle.textContent = 'Nuevo Producto';
    if (formSubtitle) formSubtitle.textContent = 'Completa los datos del producto.';
    if (saveBtnText) saveBtnText.textContent = 'Guardar Producto';
  }

  function renderImagePreview(url) {
    if (!imgPreview || !url) return;
    imgPreview.innerHTML = `<img src="${url}" alt="Vista previa del producto">`;
  }

  function getFilteredProductos() {
    const categoria = adminFiltroCategoria?.value || 'all';
    const query = (adminBusqueda?.value || '').toLowerCase().trim();

    return productos.filter((producto) => {
      const categorias = getProductoCategorias(producto);
      const matchesCategoria = categoria === 'all' || categorias.includes(categoria);
      const matchesQuery = !query
        || (producto.titulo || '').toLowerCase().includes(query)
        || (producto.descripcion || '').toLowerCase().includes(query);

      return matchesCategoria && matchesQuery;
    });
  }

  function renderTabla() {
    if (!tableBody) return;

    const visibles = getFilteredProductos();
    tableBody.innerHTML = '';

    tableEmpty?.classList.toggle('hidden', visibles.length > 0);

    visibles.forEach((producto) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          ${producto.imagen_url
            ? `<img class="table-thumb" src="${producto.imagen_url}" alt="${escapeHtml(producto.titulo)}">`
            : '<div class="table-thumb-placeholder">🥐</div>'}
        </td>
        <td><strong>${escapeHtml(producto.titulo)}</strong></td>
        <td>${getProductoCategorias(producto).map((categoria) => (
          `<span class="cat-badge">${escapeHtml(getCategoriaLabel(categoria))}</span>`
        )).join(' ') || '-'}</td>
        <td>$${formatPrice(producto.precio)}</td>
        <td>${producto.destacado ? '<span class="destacado-badge">✦ Sí</span>' : '-'}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn action-btn--edit" data-action="edit" data-id="${producto.id}">Editar</button>
            <button class="action-btn action-btn--delete" data-action="delete" data-id="${producto.id}">Eliminar</button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  async function loadProductos() {
    if (!supabase) return;

    tableLoading?.classList.remove('hidden');
    tableEmpty?.classList.add('hidden');
    if (tableBody) tableBody.innerHTML = '';

    const { data, error } = await supabase
      .from(config.productsTable)
      .select('*')
      .order('created_at', { ascending: false });

    tableLoading?.classList.add('hidden');

    if (error) {
      console.error(error);
      toast('No se pudieron cargar los productos.', 'error');
      productos = [];
      renderTabla();
      return;
    }

    productos = Array.isArray(data) ? data : [];
    renderTabla();
  }

  function openNewProduct() {
    resetForm();
    showForm(true);
  }

  function openEditProduct(id) {
    const producto = productos.find((item) => item.id === id);
    if (!producto) return;

    resetForm();
    if (productoId) productoId.value = producto.id;
    if (pTitulo) pTitulo.value = producto.titulo || '';
    if (pPrecio) pPrecio.value = producto.precio || '';
    if (pCategorias) {
      const categorias = getProductoCategorias(producto);
      pCategorias.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.checked = categorias.includes(input.value);
      });
    }
    if (pDestacado) pDestacado.checked = Boolean(producto.destacado);
    if (pDescripcion) pDescripcion.value = producto.descripcion || '';
    if (pImagenUrl) pImagenUrl.value = producto.imagen_url || '';
    if (producto.imagen_url) renderImagePreview(producto.imagen_url);

    if (formTitle) formTitle.textContent = 'Editar Producto';
    if (formSubtitle) formSubtitle.textContent = 'Actualiza los datos del producto.';
    if (saveBtnText) saveBtnText.textContent = 'Guardar Cambios';
    showForm(true);
  }

  async function uploadImageIfNeeded() {
    if (!selectedFile) return pImagenUrl?.value || null;

    if (!config.storageBucket) {
      throw new Error('No está configurado el bucket de imágenes.');
    }

    uploadProgress?.classList.remove('hidden');
    if (uploadProgressText) uploadProgressText.textContent = 'Subiendo imagen...';

    const extension = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(config.storageBucket)
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from(config.storageBucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  function validateProduct() {
    const titulo = pTitulo?.value.trim();
    const precio = Number(pPrecio?.value);
    const categorias = getSelectedCategorias();
    const categoria = categorias.length;

    if (!titulo) return 'El título es obligatorio.';
    if (!Number.isFinite(precio) || precio <= 0) return 'El precio debe ser mayor a 0.';
    if (!categoria) return 'Seleccioná una categoría.';
    return '';
  }

  async function saveProduct(event) {
    event.preventDefault();
    clearFormError();

    const validationError = validateProduct();
    if (validationError) {
      showFormError(validationError);
      return;
    }

    if (!supabase) {
      showFormError('No se pudo conectar con Supabase.');
      return;
    }

    saveBtn.disabled = true;
    if (saveBtnText) saveBtnText.textContent = 'Guardando...';

    try {
      const imagenUrl = await uploadImageIfNeeded();
      const id = productoId?.value || '';
      const categorias = getSelectedCategorias();
      const payload = {
        titulo: pTitulo.value.trim(),
        descripcion: pDescripcion?.value.trim() || null,
        precio: Number(pPrecio.value),
        categoria: categorias[0],
        categorias,
        imagen_url: imagenUrl,
        destacado: Boolean(pDestacado?.checked)
      };

      const response = id
        ? await supabase.from(config.productsTable).update(payload).eq('id', id)
        : await supabase.from(config.productsTable).insert(payload);

      if (response.error) throw response.error;

      toast(id ? 'Producto actualizado.' : 'Producto creado.');
      resetForm();
      showForm(false);
      await loadProductos();
    } catch (error) {
      console.error(error);
      showFormError(error.message || 'No se pudo guardar el producto.');
    } finally {
      saveBtn.disabled = false;
      if (saveBtnText) saveBtnText.textContent = productoId?.value ? 'Guardar Cambios' : 'Guardar Producto';
      uploadProgress?.classList.add('hidden');
    }
  }

  async function deleteProduct() {
    if (!productoAEliminar || !supabase) return;

    deleteConfirmBtn.disabled = true;

    const { error } = await supabase
      .from(config.productsTable)
      .delete()
      .eq('id', productoAEliminar);

    deleteConfirmBtn.disabled = false;
    deleteModal?.classList.add('hidden');

    if (error) {
      console.error(error);
      toast('No se pudo eliminar el producto.', 'error');
      return;
    }

    productoAEliminar = null;
    toast('Producto eliminado.');
    await loadProductos();
  }

  async function checkExistingSession() {
    if (!supabase) {
      showLoginError('No se pudo conectar con Supabase. Revisa config.js.');
      return;
    }

    const { data } = await supabase.auth.getSession();
    const userEmail = data?.session?.user?.email;

    if (userEmail === ADMIN_EMAIL) {
      showDashboard(userEmail);
      return;
    }

    if (userEmail) await supabase.auth.signOut();
    showLogin();
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearLoginError();

    if (!supabase) {
      showLoginError('No se pudo conectar con Supabase. Revisa config.js.');
      return;
    }

    const email = loginEmail?.value.trim().toLowerCase();
    const password = loginPassword?.value || '';

    if (email !== ADMIN_EMAIL) {
      showLoginError('Este usuario no tiene acceso al panel.');
      return;
    }

    if (!password) {
      showLoginError('Ingresa la contraseña.');
      return;
    }

    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginLoading(false);

    if (error) {
      console.error('Error de login Supabase:', error);
      showLoginError(error.message || 'Email o contraseña incorrectos.');
      return;
    }

    if (data?.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      showLoginError('Este usuario no tiene acceso al panel.');
      return;
    }

    showDashboard(data.user.email);
  });

  logoutBtn?.addEventListener('click', async () => {
    await supabase?.auth.signOut();
    showLogin();
  });

  sidebarLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (link.dataset.view === 'nuevo') openNewProduct();
      if (link.dataset.view === 'productos') showForm(false);
    });
  });

  btnNuevoProducto?.addEventListener('click', openNewProduct);
  btnCancelar?.addEventListener('click', () => {
    resetForm();
    showForm(false);
  });
  btnCancelar2?.addEventListener('click', () => {
    resetForm();
    showForm(false);
  });

  adminFiltroCategoria?.addEventListener('change', renderTabla);
  adminBusqueda?.addEventListener('input', renderTabla);
  productoForm?.addEventListener('submit', saveProduct);

  tableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const { action, id } = button.dataset;
    if (action === 'edit') openEditProduct(id);
    if (action === 'delete') {
      productoAEliminar = id;
      deleteModal?.classList.remove('hidden');
    }
  });

  deleteCancelBtn?.addEventListener('click', () => {
    productoAEliminar = null;
    deleteModal?.classList.add('hidden');
  });
  deleteConfirmBtn?.addEventListener('click', deleteProduct);

  imgUploader?.addEventListener('click', () => imgInput?.click());
  imgInput?.addEventListener('change', () => {
    const file = imgInput.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showFormError('La imagen no puede superar los 5MB.');
      imgInput.value = '';
      return;
    }

    selectedFile = file;
    renderImagePreview(URL.createObjectURL(file));
  });

  imgUploader?.addEventListener('dragover', (event) => {
    event.preventDefault();
    imgUploader.classList.add('drag-over');
  });

  imgUploader?.addEventListener('dragleave', () => {
    imgUploader.classList.remove('drag-over');
  });

  imgUploader?.addEventListener('drop', (event) => {
    event.preventDefault();
    imgUploader.classList.remove('drag-over');
    const file = event.dataTransfer.files?.[0];
    if (!file || !imgInput) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    imgInput.files = transfer.files;
    imgInput.dispatchEvent(new Event('change'));
  });

  fillCategorySelects();
  checkExistingSession();
});
