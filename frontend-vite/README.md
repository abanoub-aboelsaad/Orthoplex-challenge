# User Management System - Frontend

A modern, secure, and responsive user management application built with React, Vite, and modern web technologies.

## Features

### Core Features

- ✅ **User Authentication**: Secure login and registration with JWT tokens
- ✅ **Protected Routes**: Route guards to protect authenticated pages
- ✅ **Responsive Design**: Fully responsive UI that works on desktop, tablet, and mobile devices
- ✅ **Real-time Dashboard**: Display user statistics and analytics
- ✅ **Form Validation**: Client-side validation for all forms
- ✅ **Loading States**: Loader components for better UX during API calls
- ✅ **Role-based Access**: Different views for admin and regular users
- ✅ **Logout Functionality**: Secure session management with logout

### Technical Features

- **React 19**: Latest React with hooks
- **React Router v7**: Client-side routing with protected routes
- **Context API**: Global state management for authentication
- **Axios**: HTTP client for API communication
- **CSS Grid & Flexbox**: Modern responsive layouts
- **Vitest & React Testing Library**: Comprehensive unit and integration tests

## Tech Stack

- **React** 19.1.1 - UI library
- **Vite** 7.1.7 - Build tool and dev server
- **React Router DOM** 7.9.4 - Routing
- **Axios** 1.12.2 - HTTP client
- **Vitest** 3.2.4 - Testing framework
- **React Testing Library** 16.3.0 - Component testing

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   ├── Loader.jsx
│   │   ├── Loader.css
│   │   └── ProtectedRoute.jsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Dashboard.css
│   │   └── Auth.css
│   ├── services/          # API services
│   │   └── api.js
│   ├── tests/             # Test files
│   │   ├── setup.js
│   │   ├── Login.test.jsx
│   │   ├── Navbar.test.jsx
│   │   ├── ProtectedRoute.test.jsx
│   │   └── AuthContext.test.jsx
│   ├── App.jsx            # Main app component
│   ├── App.css            # Global styles
│   └── main.jsx           # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running on `http://localhost:8080`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

## Usage

### User Registration

1. Navigate to `/register`
2. Fill in the registration form:
   - Name (minimum 2 characters)
   - Email (valid email format)
   - Password (minimum 6 characters)
   - Confirm Password
   - Role (user or admin)
3. Click "Register"
4. You'll be automatically logged in and redirected to the dashboard

### User Login

1. Navigate to `/login`
2. Enter your credentials:
   - Email
   - Password
3. Click "Login"
4. On successful login, you'll be redirected to the dashboard

### Dashboard

**For Regular Users:**

- View your profile information
- See account status

**For Admin Users:**

- View comprehensive statistics
- See all registered users
- View top users by login count
- See recent registrations
- Filter and search users

### Logout

Click the "Logout" button in the navbar to end your session. You'll be redirected to the login page.

## API Integration

The frontend communicates with the backend API at `http://localhost:8080/api`.

### API Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `GET /users/analytics/statistics` - Get user statistics (admin only)
- `GET /users/analytics/top-logins` - Get top users by login (admin only)
- `GET /users/analytics/recent` - Get recent users (admin only)

## Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. On login, the server returns a JWT token
2. The token is stored in localStorage
3. The token is automatically included in all API requests via Axios interceptors
4. On logout, the token is removed from localStorage

## State Management

The application uses React Context API for state management:

- **AuthContext**: Manages authentication state, user data, and auth operations
  - `user` - Current user object
  - `login(userData, token)` - Login function
  - `logout()` - Logout function
  - `isAuthenticated()` - Check auth status
  - `getToken()` - Get auth token
  - `loading` - Loading state

## Responsive Design

The application is fully responsive using CSS Grid and Flexbox:

- **Desktop**: Full layout with side-by-side elements
- **Tablet** (≤768px): Adjusted layout with stacked elements
- **Mobile** (≤480px): Optimized for small screens with touch-friendly UI

Key responsive features:

- Collapsible navbar on mobile
- Touch-friendly buttons and inputs
- Optimized font sizes
- Fluid grid layouts

## Testing

The application includes comprehensive tests using Vitest and React Testing Library:

### Test Coverage

- **Login Component**: Form validation, submission, error handling
- **Navbar Component**: Display based on auth state, logout functionality
- **ProtectedRoute Component**: Route protection and redirects
- **AuthContext**: Login, logout, token management

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Form Validation

All forms include client-side validation:

### Login Form

- Email: Required, valid email format
- Password: Required, minimum 6 characters

### Registration Form

- Name: Required, minimum 2 characters
- Email: Required, valid email format
- Password: Required, minimum 6 characters
- Confirm Password: Required, must match password
- Role: Required, must be "user" or "admin"

## Error Handling

The application handles errors gracefully:

- Form validation errors are displayed inline
- API errors are displayed in user-friendly messages
- Loading states prevent multiple submissions
- Network errors are caught and displayed

## Performance Optimizations

- **Code Splitting**: React Router handles automatic code splitting
- **Lazy Loading**: Components are loaded on demand
- **Optimized Builds**: Vite creates optimized production builds
- **CSS Optimization**: Scoped CSS prevents style conflicts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Environment Variables

You can configure the API base URL by modifying `src/services/api.js`:

```javascript
const API_BASE_URL = "http://localhost:8080/api";
```

For production, update this to your production API URL.

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

### Deploy to Vercel

```bash
npx vercel
```

### Deploy to Netlify

```bash
npx netlify deploy --prod
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.

## Acknowledgments

- Built with React and Vite
- UI design inspired by modern web applications
- Testing setup based on React Testing Library best practices
