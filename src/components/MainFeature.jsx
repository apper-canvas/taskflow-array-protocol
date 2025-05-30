import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { format, isToday, isPast, differenceInDays } from 'date-fns'
import { useSelector } from 'react-redux'
import ApperIcon from './ApperIcon'
import TaskService from '../services/TaskService'
import ProjectService from '../services/ProjectService'

function MainFeature() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [selectedProject, setSelectedProject] = useState('all')
  const [sortBy, setSortBy] = useState('dueDate')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)

  // Get user info from Redux
  const user = useSelector((state) => state.user?.user)

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    projectId: '',
    tags: []
  })

  // Load projects and tasks on component mount
  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [])

  // Load projects from database
  const loadProjects = async () => {
    setProjectsLoading(true)
    try {
      const projectsData = await ProjectService.fetchProjects()
      
      if (projectsData && projectsData.length > 0) {
        // Map database projects to UI format
        const mappedProjects = projectsData.map(project => ({
          id: project.Id?.toString(),
          name: project.Name || 'Unnamed Project',
          color: project.color || '#6366f1',
          taskCount: 0 // Will be updated when tasks are loaded
        }))
        setProjects(mappedProjects)
        
        // Set default project for new tasks
        if (mappedProjects.length > 0 && !taskForm.projectId) {
          setTaskForm(prev => ({ ...prev, projectId: mappedProjects[0].id }))
        }
      } else {
        // Create default projects if none exist
        const defaultProjects = [
          { name: 'Personal', color: '#10b981' },
          { name: 'Work', color: '#6366f1' },
          { name: 'Learning', color: '#ec4899' }
        ]
        
        for (const project of defaultProjects) {
          await ProjectService.createProject(project)
        }
        
        // Reload projects after creating defaults
        setTimeout(() => loadProjects(), 1000)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      // Fallback to default projects for UI
      setProjects([
        { id: '1', name: 'Personal', color: '#10b981', taskCount: 0 },
        { id: '2', name: 'Work', color: '#6366f1', taskCount: 0 },
        { id: '3', name: 'Learning', color: '#ec4899', taskCount: 0 }
      ])
    } finally {
      setProjectsLoading(false)
    }
  }

  // Load tasks from database
  const loadTasks = async () => {
    setTasksLoading(true)
    try {
      const tasksData = await TaskService.fetchTasks()
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }

  // Update project task counts when tasks change
  useEffect(() => {
    const updatedProjects = projects.map(project => ({
      ...project,
      taskCount: tasks.filter(task => task.projectId === project.id).length
    }))
    setProjects(updatedProjects)
  }, [tasks])

  const handleSubmitTask = async (e) => {
    e.preventDefault()
    
    if (!taskForm.title.trim()) {
      toast.error('Task title is required')
      return
    }

    setLoading(true)
    try {
      let result
      if (editingTask) {
        result = await TaskService.updateTask(editingTask.id, taskForm)
        if (result) {
          setTasks(tasks.map(task => task.id === editingTask.id ? result : task))
        }
      } else {
        result = await TaskService.createTask(taskForm)
        if (result) {
          setTasks([...tasks, result])
        }
      }

      if (result) {
        resetForm()
      }
    } catch (error) {
      console.error('Error submitting task:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      projectId: projects.length > 0 ? projects[0].id : '',
      tags: []
    })
    setEditingTask(null)
    setShowTaskModal(false)
  }

  const handleEditTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      projectId: task.projectId,
      tags: task.tags || []
    })
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const success = await TaskService.deleteTask(taskId)
      if (success) {
        setTasks(tasks.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleToggleStatus = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    
    try {
      const updatedTask = await TaskService.updateTask(taskId, { 
        ...task, 
        status: newStatus 
      })
      
      if (updatedTask) {
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const addTag = (tag) => {
    if (tag && !taskForm.tags.includes(tag)) {
      setTaskForm({ ...taskForm, tags: [...taskForm.tags, tag] })
    }
  }

  const removeTag = (tagToRemove) => {
    setTaskForm({
      ...taskForm,
      tags: taskForm.tags.filter(tag => tag !== tagToRemove)
    })
  }

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => {
      if (selectedProject !== 'all' && task.projectId !== selectedProject) return false
      if (filterStatus !== 'all' && task.status !== filterStatus) return false
      if (searchTerm && !task.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt)
        default:
          return 0
      }
    })

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const pending = tasks.filter(t => t.status === 'pending').length
    const overdue = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'completed').length
    
    return { total, completed, pending, overdue }
  }

  const stats = getTaskStats()

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return 'AlertTriangle'
      case 'high': return 'ArrowUp'
      case 'medium': return 'Minus'
      case 'low': return 'ArrowDown'
      default: return 'Minus'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'CheckCircle'
      case 'in-progress': return 'Clock'
      case 'pending': return 'Circle'
      default: return 'Circle'
    }
  }

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null
    const days = differenceInDays(new Date(dueDate), new Date())
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Stats */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-soft border border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">Total Tasks</p>
              <p className="text-2xl font-bold text-surface-800 dark:text-surface-200">
                {tasksLoading ? '...' : stats.total}
              </p>
            </div>
            <div className="bg-primary-light bg-opacity-20 p-3 rounded-lg">
              <ApperIcon name="List" className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-soft border border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {tasksLoading ? '...' : stats.completed}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <ApperIcon name="CheckCircle" className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-soft border border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tasksLoading ? '...' : stats.pending}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <ApperIcon name="Clock" className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-soft border border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-600 dark:text-surface-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {tasksLoading ? '...' : stats.overdue}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <ApperIcon name="AlertTriangle" className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-1"
        >
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-soft border border-surface-200 dark:border-surface-700 p-6">
            <div className="mb-6">
              <button
                onClick={() => setShowTaskModal(true)}
                disabled={loading || projectsLoading}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <ApperIcon name="Plus" className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'New Task'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Projects</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedProject('all')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      selectedProject === 'all' 
                        ? 'bg-primary text-white' 
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <ApperIcon name="Folder" className="h-4 w-4" />
                      <span>All Projects</span>
                    </span>
                    <span className="text-xs">{tasks.length}</span>
                  </button>
                  
                  {projectsLoading ? (
                    <div className="text-sm text-surface-500 dark:text-surface-400 p-2">
                      Loading projects...
                    </div>
                  ) : (
                    projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProject(project.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          selectedProject === project.id 
                            ? 'bg-primary text-white' 
                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          ></div>
                          <span>{project.name}</span>
                        </span>
                        <span className="text-xs">{project.taskCount}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">Filter by Status</h3>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-3"
        >
          {/* Controls */}
          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-soft border border-surface-200 dark:border-surface-700 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 items-center space-x-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:max-w-sm">
                  <ApperIcon name="Search" className="absolute left-3 top-3 h-4 w-4 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="p-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                >
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="created">Sort by Created</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            {tasksLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full mb-4">
                  <ApperIcon name="Loader" className="h-8 w-8 text-surface-400 animate-spin" />
                </div>
                <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">Loading tasks...</h3>
              </div>
            ) : (
              <AnimatePresence>
                {filteredTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-full mb-4">
                      <ApperIcon name="CheckSquare" className="h-8 w-8 text-surface-400" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">No tasks found</h3>
                    <p className="text-surface-500 dark:text-surface-400 mb-4">
                      {searchTerm ? 'Try adjusting your search terms' : 'Create your first task to get started'}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowTaskModal(true)}
                        className="btn-primary"
                      >
                        Create Task
                      </button>
                    )}
                  </motion.div>
                ) : (
                  filteredTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="task-card group hover:scale-[1.02] transform transition-all duration-200"
                    >
                      <div className="flex items-start space-x-4">
                        <button
                          onClick={() => handleToggleStatus(task.id)}
                          className={`mt-1 p-1 rounded-full transition-colors ${
                            task.status === 'completed' 
                              ? 'text-green-600 hover:text-green-700' 
                              : 'text-surface-400 hover:text-primary'
                          }`}
                        >
                          <ApperIcon name={getStatusIcon(task.status)} className="h-5 w-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-medium text-surface-800 dark:text-surface-200 ${
                              task.status === 'completed' ? 'line-through opacity-60' : ''
                            }`}>
                              {task.title}
                            </h3>
                            
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditTask(task)}
                                className="p-1 text-surface-400 hover:text-primary"
                              >
                                <ApperIcon name="Edit3" className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-surface-400 hover:text-red-600"
                              >
                                <ApperIcon name="Trash2" className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-sm text-surface-600 dark:text-surface-400 mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`priority-badge priority-${task.priority}`}>
                              <ApperIcon name={getPriorityIcon(task.priority)} className="h-3 w-3 mr-1 inline" />
                              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                            </span>
                            
                            <span className={`status-badge status-${task.status}`}>
                              {task.status?.charAt(0).toUpperCase() + task.status?.slice(1).replace('-', ' ')}
                            </span>

                            {task.dueDate && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isPast(new Date(task.dueDate)) && task.status !== 'completed'
                                  ? 'bg-red-100 text-red-800'
                                  : isToday(new Date(task.dueDate))
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                <ApperIcon name="Calendar" className="h-3 w-3 mr-1 inline" />
                                {getDaysUntilDue(task.dueDate)}
                              </span>
                            )}
                          </div>

                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map((tag, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded-md text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-surface-200 dark:border-surface-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-surface-800 dark:text-surface-200">
                    {editingTask ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <button
                    onClick={resetForm}
                    disabled={loading}
                    className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 disabled:opacity-50"
                  >
                    <ApperIcon name="X" className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitTask} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter task title..."
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter task description..."
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Status
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                      Project
                    </label>
                    <select
                      value={taskForm.projectId}
                      onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                      className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={loading || projectsLoading}
                    >
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {taskForm.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="flex items-center space-x-1 px-2 py-1 bg-primary-light bg-opacity-20 text-primary rounded-md text-sm"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-primary hover:text-primary-dark"
                          disabled={loading}
                        >
                          <ApperIcon name="X" className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tags (press Enter)"
                    className="w-full p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(e.target.value.trim())
                        e.target.value = ''
                      }
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                  <button
                    type="submit"
                    className="flex-1 btn-primary disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading 
                      ? (editingTask ? 'Updating...' : 'Creating...') 
                      : (editingTask ? 'Update Task' : 'Create Task')
                    }
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MainFeature