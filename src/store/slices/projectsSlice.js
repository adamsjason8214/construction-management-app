import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';

// Async thunks for project operations
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(id, full_name, email),
          project_members(
            id,
            role,
            user:profiles(id, full_name, email, avatar_url)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          created_by_profile:profiles!projects_created_by_fkey(id, full_name, email),
          project_members(
            id,
            role,
            assigned_at,
            user:profiles(id, full_name, email, avatar_url, role)
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      return data.project;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ projectId, updates }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      return data.project;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }

      return projectId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addProjectMember = createAsyncThunk(
  'projects/addProjectMember',
  async ({ projectId, email, role }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      return { projectId, member: data.member };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeProjectMember = createAsyncThunk(
  'projects/removeProjectMember',
  async ({ projectId, memberId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/remove-member`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, member_id: memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      return { projectId, memberId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    filters: {
      status: 'all',
      search: '',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      })
      // Update project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      // Delete project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      // Add member
      .addCase(addProjectMember.fulfilled, (state, action) => {
        if (state.currentProject?.id === action.payload.projectId) {
          state.currentProject.project_members.push(action.payload.member);
        }
      })
      // Remove member
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        if (state.currentProject?.id === action.payload.projectId) {
          state.currentProject.project_members = state.currentProject.project_members.filter(
            m => m.id !== action.payload.memberId
          );
        }
      });
  },
});

export const { setFilters, clearCurrentProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
