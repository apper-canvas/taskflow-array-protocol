import { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import MainFeature from '../components/MainFeature'
import ApperIcon from '../components/ApperIcon'
import { motion } from 'framer-motion'
import { AuthContext } from '../App'

// User Profile Component
function UserProfile() {
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const authContext = useContext(AuthContext);

  if (!isAuthenticated || !user) {
    return (
      <div className="hidden sm:flex items-center space-x-2 bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-2">
        <ApperIcon name="User" className="h-4 w-4 text-surface-600 dark:text-surface-400" />
        <span className="text-sm text-surface-700 dark:text-surface-300">Guest</span>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center space-x-2 bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-2">
      <ApperIcon name="User" className="h-4 w-4 text-surface-600 dark:text-surface-400" />
      <span className="text-sm text-surface-700 dark:text-surface-300">
        {user.firstName || user.emailAddress || 'User'}
      </span>
      <button
        onClick={authContext?.logout}
        className="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 ml-2"
        title="Logout"
      >
        <ApperIcon name="LogOut" className="h-3 w-3" />
      </button>
    </div>
  );
}

function Home() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glassmorphism"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl shadow-soft">
                <ApperIcon name="CheckSquare" className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient">TaskFlow</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors duration-200"
              >
                <ApperIcon 
                  name={darkMode ? "Sun" : "Moon"} 
                  className="h-5 w-5" 
                />
              </button>
              <UserProfile />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-16">
        <MainFeature />
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <ApperIcon name="CheckSquare" className="h-5 w-5 text-primary" />
              <span className="text-surface-600 dark:text-surface-400 text-sm">
                TaskFlow - Streamline your productivity
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-surface-500 dark:text-surface-400">
              <span>Built with React & Tailwind</span>
              <span>•</span>
              <span>© 2024</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

export default Home