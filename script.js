const bookNameInput = document.querySelector('#bookname');
const bookDisplay = document.querySelector('#bookDisplay');
const searchResults = document.querySelector('#searchResults');
const bookResults = document.querySelector('#bookResults');
const loadingMsg = document.querySelector('#loadingMsg');
const welcomeState = document.querySelector('#welcomeState');

// Book detail elements
const bookCover = document.querySelector('#bookCover');
const bookTitle = document.querySelector('#bookTitle');
const bookAuthor = document.querySelector('#bookAuthor');
const bookSubtitle = document.querySelector('#bookSubtitle');
const bookDescription = document.querySelector('#bookDescription');
const bookEditors = document.querySelector('#bookEditors');
const bookLanguage = document.querySelector('#bookLanguage');
const bookFormat = document.querySelector('#bookFormat');
const previewBtn = document.querySelector('#previewBtn');
const reviewSection = document.querySelector('#reviewSection');
const reviewText = document.querySelector('#reviewText');

// State management
let currentBooks = [];
let currentBook = null;
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let readingHistory = JSON.parse(localStorage.getItem('readingHistory')) || [];
let currentUser = null;

// Loader element
const bookLoader = document.getElementById('bookLoader');
const loaderText = document.querySelector('.loader-text');

// Check authentication
checkAuth();

function checkAuth() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'auth.html';
        return;
    }
    currentUser = JSON.parse(userData);

    // Update user display
    const userName = document.querySelector('.user-name');
    const avatars = document.querySelectorAll('.avatar, .avatar-large');
    const menuUserName = document.querySelector('.menu-user-name');
    const menuUserEmail = document.querySelector('.menu-user-email');

    if (userName) userName.textContent = currentUser.name;
    if (menuUserName) menuUserName.textContent = currentUser.name;
    if (menuUserEmail) menuUserEmail.textContent = currentUser.email;

    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    avatars.forEach(avatar => {
        avatar.textContent = initials;
    });
}

// Toggle user menu
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close user menu when clicking outside
document.addEventListener('click', function (e) {
    const menu = document.getElementById('userMenu');
    const avatar = document.querySelector('.avatar');

    if (menu && !menu.contains(e.target) && e.target !== avatar) {
        menu.style.display = 'none';
    }
});

// Logout function
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    }
}

// Initialize navigation
initializeNavigation();
initializeNotifications();

// Loader functions
function showLoader(message = 'Loading books...') {
    loaderText.textContent = message;
    bookLoader.classList.add('active');
}

function hideLoader() {
    bookLoader.classList.remove('active');
}

// Search on Enter key
bookNameInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchBooks();
    }
});

// Auto-search as user types (debounced)
let searchTimeout;
bookNameInput.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    if (bookNameInput.value.trim().length > 2) {
        searchTimeout = setTimeout(searchBooks, 600);
    } else if (bookNameInput.value.trim().length === 0) {
        resetToWelcome();
    }
});

function searchBooks() {
    const query = bookNameInput.value.trim();

    if (!query) {
        resetToWelcome();
        return;
    }

    // Show animated loader
    showLoader('Searching Open Library database...');
    hideBookDisplay();
    welcomeState.classList.add('hidden');
    searchResults.classList.add('hidden');
    loadingMsg.textContent = '';
    bookResults.innerHTML = '';

    // Use Open Library API for comprehensive book search
    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`)
        .then(response => response.json())
        .then(data => {
            // Simulate minimum loading time for smooth UX
            setTimeout(() => {
                hideLoader();
                searchResults.classList.remove('hidden');
                loadingMsg.textContent = '';

                if (!data.docs || data.docs.length === 0) {
                    loadingMsg.textContent = 'No books found. Try a different search term.';
                    return;
                }

                // Transform Open Library data to our format
                currentBooks = data.docs.map(doc => transformOpenLibraryBook(doc));
                displaySearchResults(currentBooks);
            }, 800);
        })
        .catch(error => {
            hideLoader();
            searchResults.classList.remove('hidden');
            loadingMsg.innerHTML = `<p style="color:#ef4444;">Error: ${error.message}</p>`;
        });
}

// Transform Open Library book data to our format with better descriptions
function transformOpenLibraryBook(doc) {
    // Get description from available fields
    let description = 'No description available.';

    // Try multiple sources for description
    if (doc.first_sentence && doc.first_sentence.length > 0) {
        description = doc.first_sentence.join(' ');
    } else if (doc.subtitle) {
        description = doc.subtitle;
    } else if (doc.author_name && doc.author_name.length > 0) {
        description = `By ${doc.author_name[0]}. A book from the Open Library collection.`;
    }

    return {
        id: doc.key || doc.cover_edition_key || 'book_' + Math.random(),
        volumeInfo: {
            title: doc.title || 'Unknown Title',
            subtitle: doc.subtitle || '',
            authors: doc.author_name || ['Unknown Author'],
            publisher: doc.publisher ? doc.publisher[0] : 'Unknown Publisher',
            publishedDate: doc.first_publish_year || 'Unknown',
            description: description,
            pageCount: doc.number_of_pages_median || null,
            language: doc.language ? doc.language[0] : 'en',
            imageLinks: {
                thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
                small: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg` : null,
                medium: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
                large: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null
            },
            previewLink: `https://openlibrary.org${doc.key}`,
            infoLink: `https://openlibrary.org${doc.key}`,
            industryIdentifiers: doc.isbn ? [{ type: 'ISBN', identifier: doc.isbn[0] }] : [],
            openLibraryId: doc.key,
            hasFulltext: doc.has_fulltext || false,
            ia: doc.ia || [], // Internet Archive identifiers for reading
            workKey: doc.editions ? null : doc.keys ? null : doc.key.replace('/books/', '/works/')
        }
    };
}

// Fetch enhanced description from Open Library works API
async function fetchEnhancedDescription(book) {
    try {
        const workKey = book.volumeInfo.workKey || book.id.replace('/books/', '/works/');
        const response = await fetch(`https://openlibrary.org${workKey}.json`);
        const data = await response.json();

        if (data.description) {
            // Handle both string and object descriptions
            const desc = typeof data.description === 'string' ?
                data.description :
                data.description.value || 'No description available.';
            book.volumeInfo.description = desc.length > 500 ? desc.substring(0, 500) + '...' : desc;
        }
    } catch (error) {
        // Silently fail - use default description
        console.log('Could not fetch enhanced description');
    }
}

function displaySearchResults(books) {
    bookResults.innerHTML = '';

    books.forEach((book, index) => {
        const info = book.volumeInfo;
        const card = document.createElement('div');
        card.classList.add('book-card');
        card.dataset.index = index;

        card.innerHTML = `
            <img src="${info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'https://via.placeholder.com/140x200?text=No+Cover'}" 
                 alt="${info.title}" 
                 class="book-card-cover" />
            <h3 class="book-card-title">${info.title}</h3>
            <p class="book-card-author">${info.authors?.join(', ') || 'Unknown Author'}</p>
            <p class="book-card-description">${info.description?.slice(0, 120) || 'No description available.'}${info.description?.length > 120 ? '...' : ''}</p>
        `;

        card.addEventListener('click', () => showBookDetails(book));
        bookResults.appendChild(card);
    });
}

function showBookDetails(book) {
    const info = book.volumeInfo;
    currentBook = book;

    // Show loader during transition
    showLoader('Loading book details...');

    // Add to reading history
    addToHistory(book);

    // Hide search results, show book display after a brief delay
    searchResults.classList.add('hidden');
    welcomeState.classList.add('hidden');

    // Fetch enhanced description if available
    fetchEnhancedDescription(book).then(() => {
        populateBookDetails(book);
    }).catch(() => {
        populateBookDetails(book);
    });
}

function populateBookDetails(book) {
    const info = book.volumeInfo;

    setTimeout(() => {
        bookDisplay.classList.remove('hidden');
        hideLoader();

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);

    // Setup preview controls for navigation
    setupPreviewControls(book);

    // Populate book details
    bookCover.src = info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.thumbnail || 'https://via.placeholder.com/320x480?text=No+Cover';
    bookTitle.textContent = info.title;
    bookAuthor.textContent = info.authors?.join(', ') || 'Unknown Author';
    bookSubtitle.textContent = info.subtitle || (info.description ? info.description.slice(0, 150) + '...' : 'Get ready to uncover the story within. An engaging read awaits you.');
    bookDescription.textContent = info.description || 'No description available for this book.';

    // Editors/Publishers
    const editors = [];
    if (info.publisher) editors.push(info.publisher);
    if (info.authors && info.authors.length > 1) {
        editors.push(...info.authors.slice(1));
    }
    bookEditors.textContent = editors.length > 0 ? editors.join(', ') : 'Information not available';

    // Language
    const languageMap = {
        'en': 'English (USA & UK)',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ko': 'Korean',
        'ru': 'Russian'
    };
    bookLanguage.textContent = languageMap[info.language] || info.language?.toUpperCase() || 'English';

    // Format
    const formatDetails = [];
    if (info.printType) formatDetails.push(info.printType);
    if (info.pageCount) formatDetails.push(`${info.pageCount} pages`);
    if (info.publishedDate) {
        const year = info.publishedDate.split('-')[0];
        formatDetails.push(year);
    }
    if (info.industryIdentifiers) {
        const isbn = info.industryIdentifiers.find(id => id.type.includes('ISBN'));
        if (isbn) formatDetails.push(isbn.identifier);
    }
    bookFormat.textContent = formatDetails.length > 0 ? formatDetails.join(', ') : 'Format information not available';

    // Preview button - Always just open the external link
    previewBtn.innerHTML = 'Read Book <i class="fas fa-book-open"></i>';
    previewBtn.onclick = () => {
        window.open(info.infoLink, '_blank');
        showNotification('Opening book on Open Library...', 'info');
    };
    previewBtn.disabled = false;

    // Setup action buttons
    setupActionButtons(book);

    // Review section (simulate with description excerpt)
    if (info.description && info.description.length > 200) {
        reviewSection.classList.remove('hidden');
        const excerpt = info.description.slice(150, 300);
        reviewText.textContent = excerpt.endsWith('.') ? excerpt : excerpt + '...';
    } else {
        reviewSection.classList.add('hidden');
    }
}

function setupPreviewControls(book) {
    const controlButtons = document.querySelectorAll('.control-btn');
    const currentIndex = currentBooks.findIndex(b => b.id === book.id);

    // Up arrow - previous book
    controlButtons[0].onclick = () => {
        if (currentIndex > 0) {
            showBookDetails(currentBooks[currentIndex - 1]);
            showNotification('Previous book', 'info');
        } else {
            showNotification('This is the first book', 'warning');
        }
    };

    // Down arrow - next book
    controlButtons[1].onclick = () => {
        if (currentIndex < currentBooks.length - 1) {
            showBookDetails(currentBooks[currentIndex + 1]);
            showNotification('Next book', 'info');
        } else {
            showNotification('This is the last book', 'warning');
        }
    };

    // Disable buttons if at boundaries
    controlButtons[0].disabled = currentIndex <= 0;
    controlButtons[1].disabled = currentIndex >= currentBooks.length - 1;

    controlButtons[0].style.opacity = currentIndex <= 0 ? '0.5' : '1';
    controlButtons[1].style.opacity = currentIndex >= currentBooks.length - 1 ? '0.5' : '1';
}

function setupActionButtons(book) {
    const actionButtons = document.querySelector('.action-buttons');
    const buttons = actionButtons.querySelectorAll('.btn-icon');

    // Update bookmark icon state
    const isBookmarked = bookmarks.some(b => b.id === book.id);
    const bookmarkIcon = document.getElementById('bookmarkIcon');
    if (bookmarkIcon) {
        bookmarkIcon.className = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
    }

    // Update heart icon state
    const isFavorite = favorites.some(b => b.id === book.id);
    const heartIcon = document.getElementById('heartIcon');
    if (heartIcon) {
        heartIcon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
    }
}

function toggleBookmark(book, button) {
    const index = bookmarks.findIndex(b => b.id === book.id);

    if (index > -1) {
        bookmarks.splice(index, 1);
        showNotification('Removed from bookmarks', 'info');
    } else {
        bookmarks.push(book);
        showNotification('Added to bookmarks!', 'success');
    }

    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarkIcon();
}

function toggleFavorite(book, button) {
    const index = favorites.findIndex(b => b.id === book.id);

    if (index > -1) {
        favorites.splice(index, 1);
        showNotification('Removed from library', 'info');
    } else {
        favorites.push(book);
        showNotification('Added to library!', 'success');
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateHeartIcon();
}

function shareBook(book) {
    const info = book.volumeInfo;
    const shareData = {
        title: info.title,
        text: `Check out "${info.title}" by ${info.authors?.join(', ') || 'Unknown Author'}`,
        url: info.previewLink || window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => showNotification('Shared successfully!', 'success'))
            .catch(() => { });
    } else {
        // Fallback: copy to clipboard
        const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        navigator.clipboard.writeText(text)
            .then(() => showNotification('Link copied to clipboard!', 'success'))
            .catch(() => showNotification('Could not copy link', 'error'));
    }
}

function addToHistory(book) {
    // Remove if already exists
    const index = readingHistory.findIndex(b => b.id === book.id);
    if (index > -1) {
        readingHistory.splice(index, 1);
    }

    // Add to beginning
    readingHistory.unshift(book);

    // Keep only last 50
    if (readingHistory.length > 50) {
        readingHistory = readingHistory.slice(0, 50);
    }

    localStorage.setItem('readingHistory', JSON.stringify(readingHistory));
}

function hideBookDisplay() {
    bookDisplay.classList.add('hidden');
}

function resetToWelcome() {
    bookDisplay.classList.add('hidden');
    searchResults.classList.add('hidden');
    welcomeState.classList.remove('hidden');
    bookResults.innerHTML = '';
    loadingMsg.textContent = '';
}

// Button click handlers
function handleBookmarkClick() {
    if (!currentBook) return;
    toggleBookmark(currentBook, null);
    updateBookmarkIcon();
}

function handleShareClick() {
    if (!currentBook) return;
    shareBook(currentBook);
}

function handleDownloadClick() {
    if (!currentBook) return;
    toggleFavorite(currentBook, null);
    updateHeartIcon();
}

function updateBookmarkIcon() {
    const bookmarkIcon = document.getElementById('bookmarkIcon');
    if (!bookmarkIcon) return;
    const isBookmarked = bookmarks.some(b => b.id === currentBook.id);
    bookmarkIcon.className = isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark';
}

function updateHeartIcon() {
    const heartIcon = document.getElementById('heartIcon');
    if (!heartIcon) return;
    const isFavorite = favorites.some(b => b.id === currentBook.id);
    heartIcon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
}

// Handle back navigation
window.addEventListener('popstate', function () {
    if (bookDisplay.classList.contains('hidden')) {
        resetToWelcome();
    }
});

// Navigation system
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach((item, index) => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Handle different navigation items
            const icons = ['fa-home', 'fa-book', 'fa-clock', 'fa-bookmark', 'fa-cog', 'fa-bars'];
            const iconClass = this.querySelector('i').classList;

            if (iconClass.contains('fa-home')) {
                showHome();
            } else if (iconClass.contains('fa-book')) {
                showLibrary();
            } else if (iconClass.contains('fa-clock')) {
                showHistory();
            } else if (iconClass.contains('fa-bookmark')) {
                showBookmarks();
            } else if (iconClass.contains('fa-cog')) {
                showSettings();
            } else if (iconClass.contains('fa-bars')) {
                showMenu();
            }
        });
    });
}

function showHome() {
    showLoader('Going home...');
    setTimeout(() => {
        resetToWelcome();
        bookNameInput.value = '';
        showNotification('Welcome back!', 'info');
        hideLoader();
    }, 500);
}

function showLibrary() {
    if (favorites.length === 0) {
        showNotification('Your library is empty. Start adding favorites!', 'info');
        resetToWelcome();
        return;
    }

    showLoader('Loading your library...');
    setTimeout(() => {
        hideBookDisplay();
        welcomeState.classList.add('hidden');
        searchResults.classList.remove('hidden');
        loadingMsg.textContent = '';

        displayBooksFromList(favorites, 'Your Library');
        hideLoader();
    }, 600);
}

function showHistory() {
    if (readingHistory.length === 0) {
        showNotification('No reading history yet. Start exploring books!', 'info');
        resetToWelcome();
        return;
    }

    showLoader('Loading your history...');
    setTimeout(() => {
        hideBookDisplay();
        welcomeState.classList.add('hidden');
        searchResults.classList.remove('hidden');
        loadingMsg.textContent = '';

        displayBooksFromList(readingHistory.slice().reverse(), 'Recently Viewed');
        hideLoader();
    }, 600);
}

function showBookmarks() {
    if (bookmarks.length === 0) {
        showNotification('No bookmarks yet. Click the bookmark icon on books you want to save!', 'info');
        resetToWelcome();
        return;
    }

    showLoader('Loading bookmarks...');
    setTimeout(() => {
        hideBookDisplay();
        welcomeState.classList.add('hidden');
        searchResults.classList.remove('hidden');
        loadingMsg.textContent = '';

        displayBooksFromList(bookmarks, 'Your Bookmarks');
        hideLoader();
    }, 600);
}

function showSettings() {
    hideBookDisplay();
    welcomeState.classList.add('hidden');
    searchResults.classList.remove('hidden');

    bookResults.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e5e7eb;">
            <h2 style="font-family: 'Crimson Text', serif; font-size: 2rem; margin-bottom: 2rem;">Settings</h2>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1rem; margin-bottom: 1rem; font-weight: 600;">Display Preferences</h3>
                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; cursor: pointer;">
                    <input type="checkbox" id="darkMode" style="width: 18px; height: 18px;">
                    <span>Dark Mode (Coming Soon)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" id="compactView" style="width: 18px; height: 18px;">
                    <span>Compact View</span>
                </label>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1rem; margin-bottom: 1rem; font-weight: 600;">Data Management</h3>
                <button onclick="clearAllData()" style="background: #ef4444; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 0.5rem;">
                    Clear All Data
                </button>
                <button onclick="exportData()" style="background: #2d3748; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Export Data
                </button>
            </div>
            
            <div>
                <h3 style="font-size: 1rem; margin-bottom: 1rem; font-weight: 600;">Statistics</h3>
                <p style="color: #6b7280; margin-bottom: 0.5rem;">Bookmarks: ${bookmarks.length}</p>
                <p style="color: #6b7280; margin-bottom: 0.5rem;">Favorites: ${favorites.length}</p>
                <p style="color: #6b7280;">Reading History: ${readingHistory.length}</p>
            </div>
        </div>
    `;
    loadingMsg.textContent = '';
}

function showMenu() {
    showNotification('Menu options: Use the sidebar to navigate', 'info');
}

function displayBooksFromList(bookList, title) {
    bookResults.innerHTML = `
        <h2 style="grid-column: 1 / -1; font-family: 'Crimson Text', serif; font-size: 2rem; margin-bottom: 1rem;">${title}</h2>
    `;

    bookList.forEach((bookData, index) => {
        const card = document.createElement('div');
        card.classList.add('book-card');
        card.dataset.index = index;

        const info = bookData.volumeInfo;
        card.innerHTML = `
            <img src="${info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || 'https://via.placeholder.com/140x200?text=No+Cover'}" 
                 alt="${info.title}" 
                 class="book-card-cover" />
            <h3 class="book-card-title">${info.title}</h3>
            <p class="book-card-author">${info.authors?.join(', ') || 'Unknown Author'}</p>
            <p class="book-card-description">${info.description?.slice(0, 120) || 'No description available.'}${info.description?.length > 120 ? '...' : ''}</p>
        `;

        card.addEventListener('click', () => showBookDetails(bookData));
        bookResults.appendChild(card);
    });
}

// Notification system
function initializeNotifications() {
    const notifContainer = document.createElement('div');
    notifContainer.id = 'notificationContainer';
    notifContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(notifContainer);

    // Setup bell notification dropdown
    setupBellNotifications();
}

function setupBellNotifications() {
    const bellIcon = document.querySelector('.fa-bell');
    if (!bellIcon) return;

    // Create notification dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 60px;
        right: 20px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        width: 350px;
        max-height: 400px;
        overflow-y: auto;
        display: none;
        z-index: 999;
    `;

    dropdown.innerHTML = `
        <div style="padding: 1.25rem; border-bottom: 1px solid #e5e7eb;">
            <h3 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem;">Notifications</h3>
            <p style="font-size: 0.85rem; color: #6b7280;">Stay updated with your reading activity</p>
        </div>
        <div id="notificationList" style="padding: 0.75rem;">
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="far fa-bell" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;"></i>
                <p>No new notifications</p>
            </div>
        </div>
    `;

    document.body.appendChild(dropdown);

    // Toggle dropdown on bell click
    bellIcon.parentElement.style.position = 'relative';
    bellIcon.style.cursor = 'pointer';

    bellIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        updateNotificationList();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== bellIcon) {
            dropdown.style.display = 'none';
        }
    });
}

function updateNotificationList() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    const notifications = [];

    // Add recent bookmarks
    if (bookmarks.length > 0) {
        notifications.push({
            icon: 'fa-bookmark',
            color: '#3b82f6',
            text: `You have ${bookmarks.length} bookmarked book${bookmarks.length > 1 ? 's' : ''}`,
            time: 'Just now'
        });
    }

    // Add library count
    if (favorites.length > 0) {
        notifications.push({
            icon: 'fa-heart',
            color: '#ef4444',
            text: `${favorites.length} book${favorites.length > 1 ? 's' : ''} in your library`,
            time: 'Today'
        });
    }

    // Add reading history
    if (readingHistory.length > 0) {
        notifications.push({
            icon: 'fa-clock',
            color: '#10b981',
            text: `You've viewed ${readingHistory.length} book${readingHistory.length > 1 ? 's' : ''} recently`,
            time: 'This week'
        });
    }

    if (notifications.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="far fa-bell" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;"></i>
                <p>No new notifications</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(notif => `
        <div style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; display: flex; gap: 0.75rem; align-items: start;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${notif.color}20; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <i class="fas ${notif.icon}" style="color: ${notif.color};"></i>
            </div>
            <div style="flex: 1;">
                <p style="font-size: 0.9rem; margin-bottom: 0.25rem;">${notif.text}</p>
                <p style="font-size: 0.8rem; color: #6b7280;">${notif.time}</p>
            </div>
        </div>
    `).join('');
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    notification.style.cssText = `
        background: white;
        color: #1a1a1a;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border-left: 4px solid ${colors[type]};
        min-width: 300px;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;

    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Data management functions
function clearAllData() {
    if (confirm('Are you sure you want to clear all bookmarks, favorites, and history? This cannot be undone.')) {
        localStorage.clear();
        bookmarks = [];
        favorites = [];
        readingHistory = [];
        showNotification('All data cleared successfully', 'success');
        showSettings(); // Refresh the settings view
    }
}

function exportData() {
    const data = {
        bookmarks,
        favorites,
        readingHistory,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openshelf-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('Data exported successfully!', 'success');
}

// Book Reader Functions
function openBookReader(identifier, title) {
    // Create reader modal
    const readerModal = document.createElement('div');
    readerModal.id = 'bookReaderModal';
    readerModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
    `;

    readerModal.innerHTML = `
        <div style="background: #1a1a1a; padding: 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #333;">
            <div style="display: flex; align-items: center; gap: 1rem; color: white;">
                <button onclick="closeBookReader()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; padding: 0.5rem;">
                    <i class="fas fa-times"></i>
                </button>
                <h3 style="font-size: 1.1rem; font-weight: 600; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</h3>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="toggleFullscreen()" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem;">
                    <i class="fas fa-expand"></i> Fullscreen
                </button>
                <a href="https://archive.org/details/${identifier}" target="_blank" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; text-decoration: none; font-size: 0.9rem;">
                    <i class="fas fa-external-link-alt"></i> Open in Archive
                </a>
            </div>
        </div>
        <iframe 
            src="https://archive.org/embed/${identifier}" 
            style="flex: 1; border: none; width: 100%;"
            allowfullscreen
            allow="fullscreen"
        ></iframe>
    `;

    document.body.appendChild(readerModal);
    document.body.style.overflow = 'hidden';

    showNotification('Book reader opened!', 'success');
}

function closeBookReader() {
    const modal = document.getElementById('bookReaderModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Close book details on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (!bookDisplay.classList.contains('hidden')) {
            bookDisplay.classList.add('hidden');
            searchResults.classList.remove('hidden');
        }
    }
});