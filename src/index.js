import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import global styles
import './index.css';
import './styles.css';
import './modern-styles.css';
import './additional-styles.css';
import './boosts-styles.css';
import './form-styles.css';
import './boost-details.css';
import './ranking-styles.css'; 
import './transactions.css';

// Create app context provider for global state management
const AppContext = React.createContext();

// Theme settings - will be expanded in a real implementation
const themeSettings = {
    darkMode: true,
    primaryColor: '#3a86ff',
    secondaryColor: '#ff006e'
};

// Error boundary component for handling rendering errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // You could log the error to an error reporting service here
        console.error("Application error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h1>Something went wrong.</h1>
                    <p>The application encountered an unexpected error.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="button"
                    >
                        Reload Application
                    </button>
                    <details>
                        <summary>Error Details</summary>
                        <pre>{this.state.error && this.state.error.toString()}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

// Function to check if system prefers dark mode
const prefersDarkMode = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Create AppProvider for global state
function AppProvider({ children }) {
    // Default to system preference or true if can't detect
    const [darkMode, setDarkMode] = React.useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode !== null ? JSON.parse(savedMode) : prefersDarkMode();
    });

    // Save theme preference when it changes
    React.useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        // Apply class to body for global theme styling
        document.body.classList.toggle('light-mode', !darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prevMode => !prevMode);
    };

    const contextValue = {
        theme: {
            ...themeSettings,
            darkMode,
            toggleDarkMode
        }
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

// Make context available globally
export { AppContext };

// Mount the React application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <AppProvider>
                <App />
            </AppProvider>
        </ErrorBoundary>
    </React.StrictMode>
);

// Add support for Progressive Web App capabilities in production
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.error('SW registration failed:', error);
            });
    });
}