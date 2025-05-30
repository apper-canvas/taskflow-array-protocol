import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '../components/ApperIcon'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-soft mb-6">
            <ApperIcon name="AlertTriangle" className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-surface-800 dark:text-surface-200 mb-4">
            Page Not Found
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <Link
          to="/"
          className="inline-flex items-center space-x-2 btn-primary"
        >
          <ApperIcon name="ArrowLeft" className="h-4 w-4" />
          <span>Back to TaskFlow</span>
        </Link>
      </motion.div>
    </div>
  )
}

export default NotFound