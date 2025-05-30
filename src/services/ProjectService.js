import { toast } from 'react-toastify';

class ProjectService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    this.tableName = 'project10';
  }

  // Get all fields for project table
  getAllFields() {
    return ['Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy', 'color'];
  }

  // Get only updateable fields for create/update operations
  getUpdateableFields() {
    return ['Name', 'Tags', 'Owner', 'color'];
  }

  // Fetch all projects
  async fetchProjects(params = {}) {
    try {
      const queryParams = {
        fields: this.getAllFields(),
        ...params
      };

      const response = await this.apperClient.fetchRecords(this.tableName, queryParams);
      
      if (!response || !response.data) {
        return [];
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return [];
    }
  }

  // Get project by ID
  async getProjectById(projectId) {
    try {
      const params = {
        fields: this.getAllFields()
      };

      const response = await this.apperClient.getRecordById(this.tableName, projectId, params);
      
      if (!response || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching project with ID ${projectId}:`, error);
      toast.error('Failed to load project details');
      return null;
    }
  }

  // Create new project(s)
  async createProject(projectData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {};
      const updateableFields = this.getUpdateableFields();
      
      updateableFields.forEach(field => {
        if (projectData[field] !== undefined) {
          filteredData[field] = projectData[field];
        }
      });

      const params = {
        records: [filteredData]
      };

      const response = await this.apperClient.createRecord(this.tableName, params);

      if (response && response.success && response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        if (successfulRecords.length > 0) {
          toast.success('Project created successfully!');
          return successfulRecords[0].data;
        }
      }

      toast.error('Failed to create project');
      return null;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return null;
    }
  }

  // Update existing project
  async updateProject(projectId, projectData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: projectId };
      const updateableFields = this.getUpdateableFields();
      
      updateableFields.forEach(field => {
        if (projectData[field] !== undefined) {
          filteredData[field] = projectData[field];
        }
      });

      const params = {
        records: [filteredData]
      };

      const response = await this.apperClient.updateRecord(this.tableName, params);

      if (response && response.success && response.results) {
        const successfulUpdates = response.results.filter(result => result.success);
        if (successfulUpdates.length > 0) {
          toast.success('Project updated successfully!');
          return successfulUpdates[0].data;
        }
      }

      toast.error('Failed to update project');
      return null;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return null;
    }
  }

  // Delete project(s)
  async deleteProject(projectIds) {
    try {
      const idsArray = Array.isArray(projectIds) ? projectIds : [projectIds];
      const params = {
        RecordIds: idsArray
      };

      const response = await this.apperClient.deleteRecord(this.tableName, params);

      if (response && response.success) {
        toast.success('Project(s) deleted successfully!');
        return true;
      }

      toast.error('Failed to delete project(s)');
      return false;
    } catch (error) {
      console.error('Error deleting project(s):', error);
      toast.error('Failed to delete project(s)');
      return false;
    }
  }
}

export default new ProjectService();