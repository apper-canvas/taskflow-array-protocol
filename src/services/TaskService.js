import { toast } from 'react-toastify';

class TaskService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'task36';
  }

  // Get all fields for task table
  getAllFields() {
    return [
      'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
      'title', 'description', 'priority', 'status', 'due_date', 'project', 'created_at', 'updated_at'
    ];
  }

  // Get only updateable fields for create/update operations
  getUpdateableFields() {
    return [
      'Name', 'Tags', 'Owner', 'title', 'description', 'priority', 'status', 
      'due_date', 'project', 'created_at', 'updated_at'
    ];
  }

  // Map UI task data to database field format
  mapTaskToDatabase(taskData) {
    return {
      Name: taskData.title || taskData.Name,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: taskData.status,
      due_date: taskData.dueDate || taskData.due_date,
      project: taskData.projectId || taskData.project,
      Tags: Array.isArray(taskData.tags) ? taskData.tags.join(',') : taskData.Tags,
      created_at: taskData.createdAt || taskData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Map database field format to UI task data
  mapDatabaseToTask(dbData) {
    return {
      id: dbData.Id,
      title: dbData.title || dbData.Name,
      description: dbData.description,
      priority: dbData.priority,
      status: dbData.status,
      dueDate: dbData.due_date,
      projectId: dbData.project,
      tags: dbData.Tags ? dbData.Tags.split(',').filter(tag => tag.trim()) : [],
      createdAt: dbData.created_at || dbData.CreatedOn,
      updatedAt: dbData.updated_at || dbData.ModifiedOn,
      owner: dbData.Owner,
      createdBy: dbData.CreatedBy,
      modifiedBy: dbData.ModifiedBy
    };
  }

  // Fetch all tasks
  async fetchTasks(params = {}) {
    try {
      const queryParams = {
        fields: this.getAllFields(),
        ...params
      };

      const response = await this.apperClient.fetchRecords(this.tableName, queryParams);
      
      if (!response || !response.data) {
        return [];
      }

      return response.data.map(task => this.mapDatabaseToTask(task));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return [];
    }
  }

  // Get task by ID
  async getTaskById(taskId) {
    try {
      const params = {
        fields: this.getAllFields()
      };

      const response = await this.apperClient.getRecordById(this.tableName, taskId, params);
      
      if (!response || !response.data) {
        return null;
      }

      return this.mapDatabaseToTask(response.data);
    } catch (error) {
      console.error(`Error fetching task with ID ${taskId}:`, error);
      toast.error('Failed to load task details');
      return null;
    }
  }

  // Create new task
  async createTask(taskData) {
    try {
      // Map and filter to only include updateable fields
      const mappedData = this.mapTaskToDatabase(taskData);
      const filteredData = {};
      const updateableFields = this.getUpdateableFields();
      
      updateableFields.forEach(field => {
        if (mappedData[field] !== undefined) {
          filteredData[field] = mappedData[field];
        }
      });

      const params = {
        records: [filteredData]
      };

      const response = await this.apperClient.createRecord(this.tableName, params);

      if (response && response.success && response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        if (successfulRecords.length > 0) {
          toast.success('Task created successfully!');
          return this.mapDatabaseToTask(successfulRecords[0].data);
        }
      }

      toast.error('Failed to create task');
      return null;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return null;
    }
  }

  // Update existing task
  async updateTask(taskId, taskData) {
    try {
      // Map and filter to only include updateable fields
      const mappedData = this.mapTaskToDatabase(taskData);
      const filteredData = { Id: taskId };
      const updateableFields = this.getUpdateableFields();
      
      updateableFields.forEach(field => {
        if (mappedData[field] !== undefined) {
          filteredData[field] = mappedData[field];
        }
      });

      const params = {
        records: [filteredData]
      };

      const response = await this.apperClient.updateRecord(this.tableName, params);

      if (response && response.success && response.results) {
        const successfulUpdates = response.results.filter(result => result.success);
        if (successfulUpdates.length > 0) {
          toast.success('Task updated successfully!');
          return this.mapDatabaseToTask(successfulUpdates[0].data);
        }
      }

      toast.error('Failed to update task');
      return null;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return null;
    }
  }

  // Delete task(s)
  async deleteTask(taskIds) {
    try {
      const idsArray = Array.isArray(taskIds) ? taskIds : [taskIds];
      const params = {
        RecordIds: idsArray
      };

      const response = await this.apperClient.deleteRecord(this.tableName, params);

      if (response && response.success) {
        toast.success('Task(s) deleted successfully!');
        return true;
      }

      toast.error('Failed to delete task(s)');
      return false;
    } catch (error) {
      console.error('Error deleting task(s):', error);
      toast.error('Failed to delete task(s)');
      return false;
    }
  }

  // Search tasks by title or description
  async searchTasks(searchTerm) {
    try {
      const params = {
        fields: this.getAllFields(),
        where: [
          {
            fieldName: "title",
            operator: "Contains",
            values: [searchTerm]
          }
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response || !response.data) {
        return [];
      }

      return response.data.map(task => this.mapDatabaseToTask(task));
    } catch (error) {
      console.error('Error searching tasks:', error);
      toast.error('Failed to search tasks');
      return [];
    }
  }

  // Get tasks by project ID
  async getTasksByProject(projectId) {
    try {
      const params = {
        fields: this.getAllFields(),
        where: [
          {
            fieldName: "project",
            operator: "ExactMatch", 
            values: [projectId]
          }
        ]
      };

      const response = await this.apperClient.fetchRecords(this.tableName, params);
      
      if (!response || !response.data) {
        return [];
      }

      return response.data.map(task => this.mapDatabaseToTask(task));
    } catch (error) {
      console.error('Error fetching tasks by project:', error);
      toast.error('Failed to load project tasks');
      return [];
    }
  }
}

export default new TaskService();