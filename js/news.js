// News Section JavaScript - Swappable News Lists
document.addEventListener("DOMContentLoaded", function () {
  initNewsSystem();
});

function initNewsSystem() {
  const newsContainer = document.getElementById('js-newsLists');
  const paginationContainer = document.getElementById('js-pageNavs');
  const tabs = document.querySelectorAll('.news-tab');

  // Configuration
  const newsConfig = {
    itemsPerPage: 6,
    currentPage: 1,
    currentCategory: 'general',
    newsData: {
      general: [],
      projects: [],
      updates: []
    }
  };

  // Initialize the news system
  function init() {
    setupTabHandlers();
    loadNewsFromFile(newsConfig.currentCategory);
    setupPaginationHandlers();
  }

  // Setup tab click handlers
  function setupTabHandlers() {
    tabs.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        const category = this.getAttribute('data-category');

        if (category !== newsConfig.currentCategory) {
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          this.classList.add('active');

          // Update current category and reset page
          newsConfig.currentCategory = category;
          newsConfig.currentPage = 1;

          // Load news for new category
          loadNewsForCategory(category);
        }
      });
    });
  }

  // Load news for specific category
  function loadNewsForCategory(category) {
    showLoadingState();

    // Simulate loading delay for better UX
    setTimeout(() => {
      const newsData = newsConfig.newsData[category] || [];
      renderNews(newsData);
      renderPagination(newsData.length);
      hideLoadingState();
    }, 300);
  }

  // Load news from external HTML files (for future implementation)
  async function loadNewsFromFile(category, isCustom = false) {
    try {
      const response = await fetch(`news/${category}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load ${category} news`);
      }

      const htmlContent = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const newsItems = doc.querySelectorAll('.newsList');

      // Convert HTML elements to data objects
      const newsData = Array.from(newsItems).map(item => {
        const link = item.querySelector('.newsList__link');
        const date = item.querySelector('.newsTitle__date');
        const title = item.querySelector('.newsTitle__txt');

        return {
          date: date ? date.getAttribute('datetime') : '',
          title: title ? title.textContent : '',
          link: link ? link.getAttribute('href') : '#'
        };
      });

      if (!isCustom) {
        newsConfig.newsData[category] = newsData;
      }
      renderNews(newsData);
      renderPagination(newsData.length);

    } catch (error) {
      console.error('Error loading news:', error);
      // Fallback to sample data
      const fallbackData = newsConfig.newsData[category] || [];
      renderNews(fallbackData);
      renderPagination(fallbackData.length);
    }
  }

  // Render news items
  function renderNews(newsData) {
    const startIndex = (newsConfig.currentPage - 1) * newsConfig.itemsPerPage;
    const endIndex = startIndex + newsConfig.itemsPerPage;
    const pageItems = newsData.slice(startIndex, endIndex);

    newsContainer.innerHTML = '';

    pageItems.forEach(item => {
      const listItem = createNewsItem(item);
      newsContainer.appendChild(listItem);
    });

    // Add entrance animation
    const newsItems = newsContainer.querySelectorAll('.newsList');
    newsItems.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';

      setTimeout(() => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  // Create individual news item
  function createNewsItem(newsData) {
    const li = document.createElement('li');
    li.className = 'newsList';

    const formattedDate = formatDate(newsData.date);

    li.innerHTML = `
      <a href="${newsData.link}" class="newsList__link">
        <time class="newsTitle__date" datetime="${newsData.date}">${formattedDate}</time>
        <p class="newsTitle__txt">${newsData.title}</p>
      </a>
    `;

    return li;
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
  }

  // Render pagination
  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / newsConfig.itemsPerPage);

    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }

    paginationContainer.style.display = 'flex';

    const paginationList = paginationContainer.querySelector('.pagenav-num');
    paginationList.innerHTML = '';

    // Create page buttons
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = '#';
      a.className = 'page';
      a.setAttribute('data-page', i);

      if (i === newsConfig.currentPage) {
        a.classList.add('current');
      }

      const span = document.createElement('span');
      span.textContent = i;
      a.appendChild(span);

      li.appendChild(a);
      paginationList.appendChild(li);
    }
  }

  // Setup pagination handlers
  function setupPaginationHandlers() {
    paginationContainer.addEventListener('click', function (e) {
      e.preventDefault();

      const pageLink = e.target.closest('.page');
      if (!pageLink) return;

      const newPage = parseInt(pageLink.getAttribute('data-page'));

      if (newPage !== newsConfig.currentPage) {
        // Update current page
        newsConfig.currentPage = newPage;

        // Update pagination active state
        const pageLinks = paginationContainer.querySelectorAll('.page');
        pageLinks.forEach(link => link.classList.remove('current'));
        pageLink.classList.add('current');

        // Reload news for current category
        const newsData = newsConfig.newsData[newsConfig.currentCategory] || [];
        renderNews(newsData);

        // Smooth scroll to news section
        document.getElementById('news').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  // Show loading state
  function showLoadingState() {
    newsContainer.classList.add('loading');
    newsContainer.innerHTML = '<li class="newsList"><div class="loading-placeholder">Loading news...</div></li>';
  }

  // Hide loading state
  function hideLoadingState() {
    newsContainer.classList.remove('loading');
  }

  // Public API for external news loading
  window.newsSystem = {
    loadCategory: function (category) {
      if (newsConfig.newsData[category]) {
        newsConfig.currentCategory = category;
        newsConfig.currentPage = 1;

        // Update active tab
        tabs.forEach(tab => {
          tab.classList.toggle('active', tab.getAttribute('data-category') === category);
        });

        loadNewsForCategory(category);
      }
    },

    addNewsItem: function (category, newsItem) {
      if (!newsConfig.newsData[category]) {
        newsConfig.newsData[category] = [];
      }

      newsConfig.newsData[category].unshift(newsItem);

      if (newsConfig.currentCategory === category) {
        loadNewsForCategory(category);
      }
    },

    loadFromFile: function (category) {
      loadNewsFromFile(category);
    },

    loadCustomNews: function (htmlFile, title = 'Custom News') {
      tabs.forEach(tab => tab.classList.remove('active'));
      const titleElement = document.querySelector('.newsFrame_title__txt');
      if (titleElement) {
        titleElement.textContent = title.toUpperCase();
      }
      loadNewsFromFile(htmlFile, true)
    }
  };

  // Initialize the system
  init();
  loadNewsFromFile('general');
  loadNewsFromFile('projects');
  loadNewsFromFile('updates');
}

// Utility function to load news from external HTML files
// Usage: loadNewsFromHTML('general', 'path/to/general-news.html')
async function loadNewsFromHTML(category, filePath) {
  try {
    const response = await fetch(filePath);
    const htmlContent = await response.text();

    // Parse the HTML and extract news items
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const newsItems = doc.querySelectorAll('.newsList');

    // Clear existing content and add new items
    const newsContainer = document.getElementById('js-newsLists');
    newsContainer.innerHTML = '';

    newsItems.forEach(item => {
      newsContainer.appendChild(item.cloneNode(true));
    });

    console.log(`Loaded ${newsItems.length} news items from ${filePath}`);

  } catch (error) {
    console.error('Error loading news from HTML file:', error);
  }
}

