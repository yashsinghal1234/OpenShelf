# OpenShelf (Book_Searcher)

OpenShelf is a modern book discovery web app built with HTML, CSS, and JavaScript.
Users can search books from Open Library, view details, save favorites/bookmarks, and authenticate using email/password or Google OAuth.

## Features

- Search books by title, author, or topic
- Book cards with cover, title, author, and short description
- Detailed book view with metadata
- Enhanced descriptions fetched from Open Library Work API
- Read button opens the book page on Open Library
- Bookmark and favorites support using localStorage
- Reading history tracking
- Email/password signup and login (localStorage)
- Google OAuth login with Google Identity Services
- Responsive UI with animated loader and notifications

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Open Library API
- Google Identity Services (OAuth)
- LocalStorage for client-side persistence

## Project Structure

Book_Searcher/
- auth.html
- auth.css
- auth.js
- index.html
- style.css
- script.js

## Local Setup

1. Open the project in VS Code.
2. Start a local server (for example Live Server).
3. Open `auth.html`.
4. Login/signup, then continue to the app.

Example local URL:
- `http://127.0.0.1:5500/Book_Searcher/auth.html`

## Google OAuth Setup

Google login requires correct OAuth configuration in Google Cloud Console.

### Authorized JavaScript Origins

Use only origins (no paths):
- `http://127.0.0.1:5500`
- `https://yashsinghal1234.github.io`

### Authorized Redirect URIs

Paths are allowed here:
- `http://127.0.0.1:5500/Book_Searcher/auth.html`
- `https://yashsinghal1234.github.io/OpenShelf/`
- `https://yashsinghal1234.github.io/OpenShelf/Book_Searcher/auth.html`

## GitHub Pages Deployment

1. Push code to GitHub repository.
2. Enable GitHub Pages in repository Settings.
3. Use the published URL to access the app.
4. Ensure OAuth origins/redirect URIs match your final domain.

Expected hosted auth URL:
- `https://yashsinghal1234.github.io/OpenShelf/Book_Searcher/auth.html`

## Notes

- Email/password auth is demo-style and stored in localStorage.
- Passwords are Base64-encoded in this project (not production-grade security).
- For production, use a backend and secure token/session handling.

## Author

Yash Singhal
