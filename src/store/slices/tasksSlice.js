import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';

// Async thunks for task operations
export const fetchTasksByProject = createAsyncThunk(
  'tasks/fetchTasksByProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, email),
          depends_on_task:tasks!tasks_depends_on_fkey(id, title, status)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      return data.task;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updates }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ task_id: taskId, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      return data.task;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async ({ projectId, taskId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, task_id: taskId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      return taskId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    loading: false,
    error: null,
    filters: {
      status: 'all',
      priority: 'all',
      assignedTo: 'all',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearTasks: (state) => {
      state.tasks = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    // Optimistic update for drag-and-drop
    moveTask: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = newStatus;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasksByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasksByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasksByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(t => t.id !== action.payload);
      });
  },
});

export const { setFilters, clearTasks, clearError, moveTask } = tasksSlice.actions;
export default tasksSlice.reducer;
