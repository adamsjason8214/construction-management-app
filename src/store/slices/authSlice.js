import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase, signIn, signUp, signOut } from '../../lib/supabase';

// Async thunks for authentication
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await signIn(email, password);

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      return { user: data.user, profile, session: data.session };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async ({ email, password, fullName, role = 'worker' }, { rejectWithValue }) => {
    try {
      const data = await signUp(email, password, fullName, role);
      return { user: data.user, session: data.session };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return null;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      return { user: session.user, profile, session };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const userId = auth.user?.id;

      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    profile: null,
    session: null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.session = action.payload.session;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.session = action.payload.session;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.initialized = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.session = null;
        state.loading = false;
        state.error = null;
      })
      // Check session
      .addCase(checkSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.profile = action.payload.profile;
          state.session = action.payload.session;
        }
      })
      .addCase(checkSession.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
