// Constantes para los elementos del DOM
const contentEl = document.getElementById("content");
const tocEl = document.getElementById("toc");
const breadcrumbsEl = document.getElementById("breadcrumbs");
const themeBtn = document.getElementById("toggle-theme");
const menu = document.getElementById("menu");

const searchInput = document.getElementById("searchInput");
const searchResultsEl = document.getElementById("searchResults");
const globalCategoriesContainer = document.getElementById("global-categories-container");
const globalTagsContainer = document.getElementById("global-tags-container");

// Nuevos elementos para el control de fuentes
const fontSelector = document.getElementById("font-selector");
const increaseFontBtn = document.getElementById("increase-font");
const decreaseFontBtn = document.getElementById("decrease-font");
let searchIndex = [];

// Función para cargar el índice de búsqueda (search_index.json)
// Se ejecuta al inicio para tener los datos de los posts disponibles.
async function loadSearchIndex() {
  try {
    const res = await fetch("docs/search_index.json");
    if (!res.ok) throw new Error("Índice de búsqueda no encontrado");
    searchIndex = await res.json();
    console.log("Índice de búsqueda cargado:", searchIndex);
    // Una vez cargado, generamos las nubes de categorías y etiquetas.
    generateCategoryCloud();
    generateGlobalTags();
  } catch (error) {
    console.error("Error al cargar el índice de búsqueda:", error);
  }
}

// Inicia el proceso de carga del índice.
loadSearchIndex();

// Lógica para el cambio de tema (claro/oscuro)
// Comprueba la preferencia del sistema o el último tema guardado en el almacenamiento local.
if (localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.body.classList.add("dark");
}

// Escuchador de eventos para el botón de cambio de tema.
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Lógica para el cambio de fuente y tamaño
if (localStorage.getItem('fontFamily')) {
    document.body.style.fontFamily = localStorage.getItem('fontFamily');
    fontSelector.value = localStorage.getItem('fontFamily');
}
if (localStorage.getItem('fontSize')) {
    document.documentElement.style.setProperty('--base-font-size', localStorage.getItem('fontSize') + 'px');
}

fontSelector.addEventListener('change', (e) => {
    const selectedFont = e.target.value;
    document.body.style.fontFamily = selectedFont;
    localStorage.setItem('fontFamily', selectedFont);
});

increaseFontBtn.addEventListener('click', () => {
    let currentSize = parseInt(getComputedStyle(document.documentElement).fontSize);
    if (currentSize < 24) {
        currentSize += 2;
        document.documentElement.style.setProperty('--base-font-size', currentSize + 'px');
        localStorage.setItem('fontSize', currentSize);
    }
});

decreaseFontBtn.addEventListener('click', () => {
    let currentSize = parseInt(getComputedStyle(document.documentElement).fontSize);
    if (currentSize > 12) {
        currentSize -= 2;
        document.documentElement.style.setProperty('--base-font-size', currentSize + 'px');
        localStorage.setItem('fontSize', currentSize);
    }
});

// Función para parsear el frontmatter de un archivo Markdown.
// Extrae los metadatos (título, fecha, tags, etc.) del inicio del archivo.
function parseMarkdown(md) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---([\s\S]*)/;
  const match = frontmatterRegex.exec(md);
  
  if (match) {
    const frontmatter = match[1];
    const content = match[2];
    const data = {};
    frontmatter.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join(':').trim();
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.substring(1, value.length - 1).split(',').map(item => item.trim().replace(/"/g, ''));
        }
        data[key] = value;
      }
    });
    return { data, content };
  }
  return { data: {}, content: md };
}

// Genera la "nube" de categorías en el sidebar.
// Recorre el índice de búsqueda y crea enlaces únicos para cada categoría.
function generateCategoryCloud() {
  const allCategories = new Set();
  searchIndex.forEach(doc => {
    if (doc.category) {
      doc.category.forEach(cat => allCategories.add(cat));
    }
  });

  if (allCategories.size > 0) {
    let html = '<h3>Categorías</h3><div class="category-cloud">';
    allCategories.forEach(category => {
      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
      html += `<a href="#category/${categoryId}" class="category-link" data-category="${categoryId}">${category}</a>`;
    });
    html += '</div>';
    globalCategoriesContainer.innerHTML = html;
  }
}

// Genera la "nube" de etiquetas en el sidebar.
// Recorre el índice y crea enlaces únicos para cada etiqueta.
function generateGlobalTags() {
  const allTags = new Set();
  searchIndex.forEach(doc => {
    if (doc.tags) {
      doc.tags.forEach(tag => allTags.add(tag));
    }
  });

  if (allTags.size > 0) {
    let tagsHtml = '<h3>Etiquetas</h3><div class="tag-cloud">';
    allTags.forEach(tag => {
      tagsHtml += `<a href="#tag/${tag}" class="tag-link" data-tag="${tag}">${tag}</a>`;
    });
    tagsHtml += '</div>';
    globalTagsContainer.innerHTML = tagsHtml;
  }
}

// Genera la vista para una categoría específica.
// Filtra los posts por la categoría y crea una lista de sumarios.
function generateCategoryView(categoryId) {
  const categoryPosts = searchIndex.filter(post => 
      post.category && post.category.some(cat => cat.toLowerCase().replace(/\s+/g, '-') === categoryId)
  );
  
  const title = categoryPosts.length > 0 ? categoryPosts[0].category.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === categoryId) : categoryId;
  let html = `<h1>${title}</h1>`;

  if (categoryPosts.length > 0) {
    html += '<ul class="category-list">';
    categoryPosts.forEach(post => {
      const readingTime = Math.ceil(post.word_count / 160);
      html += `
        <li class="category-post">
          <h2><a href="#${post.id}">${post.title}</a></h2>
          <p class="post-meta">
            <span>📅 ${post.date}</span>
            <span>⏳ ${readingTime} min de lectura</span>
          </p>
          <p>${post.summary}</p>
          <div class="tags">
            ${post.tags.map(tag => `<a href="#tag/${tag}" class="tag-link" data-tag="${tag}">${tag}</a>`).join('')}
          </div>
        </li>
      `;
    });
    html += '</ul>';
  } else {
    html += '<p>No hay posts en esta categoría.</p>';
  }

  contentEl.innerHTML = html;
  generateBreadcrumbs(`category/${categoryId}`);
}

// Lógica principal para cargar el contenido de la página.
// Decide qué contenido mostrar basándose en el hash de la URL.
async function loadPage(page) {
  if (page === "inicio") {
    try {
      const res = await fetch(`docs/${page}.md`);
      if (!res.ok) throw new Error("Página de inicio no encontrada");
      const md = await res.text();
      const html = marked.parse(md, { breaks: true });
      contentEl.innerHTML = html;
      generateTOC();
      generateBreadcrumbs(page);
    } catch (error) {
      contentEl.innerHTML = `<p>Error: ${error.message}</p>`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Agregado: Scroll al inicio
    return;
  }
  
  if (page.startsWith("category/")) {
    const categoryId = page.substring(9);
    generateCategoryView(categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Agregado: Scroll al inicio
    return;
  }
  
  if (page.startsWith('tag/')) {
    const tag = page.substring(4);
    const filteredResults = searchIndex.filter(item => item.tags && item.tags.includes(tag));
    let resultsHTML = `<h2>Posts con la etiqueta "${tag}"</h2><ul class="category-list">`;
    if (filteredResults.length > 0) {
        filteredResults.forEach(item => {
            const readingTime = Math.ceil(item.word_count / 160);
            const categoryLinks = item.category.map(cat => 
              `<span>Categoría: <a href="#category/${cat.toLowerCase().replace(/\s+/g, '-')}" class="category-link">${cat}</a></span>`
            ).join('');
            resultsHTML += `
                <li>
                    <h2><a href="#${item.id}">${item.title}</a></h2>
                    <p class="post-meta">
                      ${categoryLinks}
                      <span>📅 ${item.date}</span>
                      <span>⏳ ${readingTime} min de lectura</span>
                    </p>
                    <p>${item.summary}</p>
                    <div class="tags">
                        ${item.tags.map(t => `<a href="#tag/${t}" class="tag-link">${t}</a>`).join('')}
                    </div>
                </li>
            `;
        });
    } else {
        resultsHTML += `<li>No se encontraron posts con esta etiqueta.</li>`;
    }
    resultsHTML += '</ul>';
    contentEl.innerHTML = resultsHTML;
    generateBreadcrumbs(`tag/${tag}`);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Agregado: Scroll al inicio
    return;
  }

  try {
    const pageToFetch = page.replace('contenido', 'paginas');
    const res = await fetch(`docs/${pageToFetch}.md`);
    if (!res.ok) throw new Error("Página no encontrada");
    const md = await res.text();
    const { data, content } = parseMarkdown(md);

    // Busca los metadatos del post en el índice de búsqueda
    const postData = searchIndex.find(post => post.id === page);
    let postMetaHtml = '';
    if (postData) {
      const readingTime = Math.ceil(postData.word_count / 160);
      const categoryLinks = postData.category.map(cat => 
          `<a href="#category/${cat.toLowerCase().replace(/\s+/g, '-')}" class="category-link">${cat}</a>`
      ).join(', ');
      
      postMetaHtml = `
        <p class="post-meta">
          <span>Categoría: ${categoryLinks}</span>
          <span>Fecha: ${postData.date}</span>
          <span>Lectura: ${readingTime} min</span>
        </p>
        <div class="tags">
          ${postData.tags.map(tag => `<a href="#tag/${tag}" class="tag-link">${tag}</a>`).join('')}
        </div>
      `;
    }

    const html = marked.parse(content, { breaks: true });
    contentEl.innerHTML = postMetaHtml + html;
    Prism.highlightAll(); // Resalta la sintaxis del código
    generateTOC();
    generateBreadcrumbs(page);

    // Actualiza el estado activo del menú lateral
    const currentActive = document.querySelector("#menu a.active");
    if (currentActive) {
      currentActive.classList.remove("active");
    }
    const newActive = document.querySelector(`#menu a[href="#${page}"]`);
    if (newActive) {
      newActive.classList.add("active");
    }

  } catch (error) {
    contentEl.innerHTML = `<h2>Error</h2><p>${error.message}</p>`;
    tocEl.innerHTML = "";
    breadcrumbsEl.innerHTML = "";
  }
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Agregado: Scroll al inicio
}

// Genera la tabla de contenidos (TOC) a partir de los títulos (h1, h2, h3)
function generateTOC() {
  const headings = contentEl.querySelectorAll("h1, h2, h3");
  if (!headings.length) {
    tocEl.innerHTML = "";
    return;
  }
  let tocHTML = "<ul>";
  headings.forEach(h => {
    const id = h.textContent.toLowerCase().replace(/\s+/g, "-");
    h.id = id;
    tocHTML += `<li><a href="#${id}">${h.textContent}</a></li>`;
  });
  tocHTML += "</ul>";
  tocEl.innerHTML = tocHTML;
}

// Genera el "rastro de migas" (breadcrumbs) en la parte superior de la página
function generateBreadcrumbs(page) {
  let breadcrumbText = `<a href="#inicio">Inicio</a>`;
  const parts = page.split('/');
  
  if (page === 'inicio') {
  } else if (page.startsWith('category/')) {
    const categoryName = parts[1];
    breadcrumbText += ` > <a href="#category/${categoryName}">${categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace('-', ' ')}</a>`;
  } else if (page.startsWith('tag/')) {
    const tagName = parts[1];
    breadcrumbText += ` > <a href="#tag/${tagName}">Etiqueta: ${tagName}</a>`;
  } else if (parts.length > 1) {
    const categoryName = parts[0];
    const subPage = parts[1];
    
    const post = searchIndex.find(p => p.id === page);
    let categoryTitle = "";
    if (categoryName === "paginas") {
        categoryTitle = "Páginas";
    } else if (post && post.category) {
        categoryTitle = post.category[0];
    } else {
        categoryTitle = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace('-', ' ');
    }
    
    breadcrumbText += ` > <a href="#category/${categoryName}">${categoryTitle}</a>`;
    
    if (subPage !== 'index') {
        const postTitle = post ? post.title : subPage;
        breadcrumbText += ` > ${postTitle}`;
    }
  } else {
    const post = searchIndex.find(p => p.id === page);
    let title = post ? post.title : page;
    breadcrumbText += ` > ${title}`;
  }
  
  breadcrumbsEl.innerHTML = breadcrumbText;
}

// Maneja la funcionalidad de búsqueda.
// Filtra el índice de búsqueda en tiempo real a medida que el usuario escribe.
function handleSearch() {
  const query = searchInput.value.toLowerCase();
  searchResultsEl.innerHTML = '';
  if (query.length < 2) {
    return;
  }
  
  const results = searchIndex.filter(item => 
    item.title.toLowerCase().includes(query) ||
    item.summary.toLowerCase().includes(query) ||
    (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
  );

  let resultsHTML = '';
  if (results.length > 0) {
    results.forEach(item => {
      // Cambio aquí: Usamos el nuevo estilo 'search-result-link'
      resultsHTML += `<li><a href="#${item.id}" class="search-result-link">${item.title}</a></li>`;
    });
  } else {
    resultsHTML += `<li>No se encontraron resultados.</li>`;
  }
  searchResultsEl.innerHTML = resultsHTML;
}

// Escuchador de eventos para el menú lateral.
// Controla el despliegue de submenús y la navegación.
menu.addEventListener("click", (e) => {
  const target = e.target;
  if (target.classList.contains("toggle-icon")) {
    const parent = target.parentElement;
    const submenu = parent.nextElementSibling;
    if (submenu && submenu.classList.contains("submenu")) {
      target.classList.toggle("open");
      submenu.classList.toggle("open");
    } else {
        const nestedSubmenu = parent.querySelector(".submenu");
        if (nestedSubmenu) {
            target.classList.toggle("open");
            nestedSubmenu.classList.toggle("open");
        }
    }
  }
  else if (target.tagName === "A" && target.getAttribute("href") !== "#") {
    e.preventDefault();
    const page = target.getAttribute("href").substring(1);
    loadPage(page);
    history.pushState(null, "", `#${page}`);
  }
});

// Escuchador para los enlaces del "rastro de migas".
breadcrumbsEl.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName === "A" && target.getAttribute("href") !== "#") {
    e.preventDefault();
    const page = target.getAttribute("href").substring(1);
    loadPage(page);
    history.pushState(null, "", `#${page}`);
  }
});

// Escuchador para la nube de categorías.
globalCategoriesContainer.addEventListener('click', (e) => {
    e.preventDefault();
    const target = e.target;
    if (target.tagName === 'A' && target.classList.contains('category-link')) {
        const page = target.getAttribute('href').substring(1);
        loadPage(page);
        history.pushState(null, '', `#${page}`);
    }
});

// Escuchador para la nube de etiquetas.
globalTagsContainer.addEventListener('click', (e) => {
    e.preventDefault();
    const target = e.target;
    if (target.tagName === 'A' && target.classList.contains('tag-link')) {
        const page = target.getAttribute('href').substring(1);
        loadPage(page);
        history.pushState(null, '', `#${page}`);
    }
});

// Escuchador de eventos para los enlaces en el área de contenido principal.
contentEl.addEventListener('click', (e) => {
  const target = e.target.closest('a');
  if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
    e.preventDefault();
    const page = target.getAttribute('href').substring(1);
    loadPage(page);
    history.pushState(null, '', `#${page}`);
  }
});

// Escuchador para la entrada de búsqueda.
searchInput.addEventListener('keyup', handleSearch);

// Escuchador para los resultados de la búsqueda.
searchResultsEl.addEventListener('click', (e) => {
    e.preventDefault();
    const target = e.target;
    if (target.tagName === 'A') {
        const page = target.getAttribute('href').substring(1);
        loadPage(page);
        history.pushState(null, '', `#${page}`);
        searchResultsEl.innerHTML = '';
        searchInput.value = '';
    }
});

// Carga la página inicial al cargar el documento (usa el hash o "inicio").
window.addEventListener("DOMContentLoaded", () => {
  const initialPage = window.location.hash.substring(1) || "inicio";
  loadPage(initialPage);
});

// Version actualizada al 5/9/2025 20:13