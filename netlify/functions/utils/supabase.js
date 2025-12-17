const { createClient } = require('@supabase/supabase-js');

/**
 * Create a Supabase client for server-side use with service role key
 * Use this for admin operations that bypass RLS
 */
const getSupabaseAdmin = () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

/**
 * Create a Supabase client with user auth token
 * Use this for operations that respect RLS policies
 */
const getSupabaseUser = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

/**
 * Verify and get the authenticated user
 */
const getAuthenticatedUser = async (authHeader) => {
  const supabase = getSupabaseUser(authHeader);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { user, supabase };
};

/**
 * Get user profile with role
 */
const getUserProfile = async (userId, supabase) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return profile;
};

/**
 * Check if user has permission for action
 */
const checkPermission = (userRole, requiredRoles) => {
  if (userRole === 'admin') return true;
  return requiredRoles.includes(userRole);
};

module.exports = {
  getSupabaseAdmin,
  getSupabaseUser,
  getAuthenticatedUser,
  getUserProfile,
  checkPermission
};
