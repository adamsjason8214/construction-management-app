const { getSupabaseAdmin, getAuthenticatedUser, getUserProfile } = require('./utils/supabase');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const { user, supabase } = await getAuthenticatedUser(authHeader);
    const profile = await getUserProfile(user.id, supabase);

    // Check permissions - only admins and project_managers can create projects
    if (profile.role !== 'admin' && profile.role !== 'project_manager') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to create projects' })
      };
    }

    // Parse request body
    const body = JSON.parse(event.body);
    const { name, description, location, budget, start_date, estimated_end_date, status } = body;

    // Validate required fields
    if (!name || !location) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project name and location are required' })
      };
    }

    // Use admin client to create project (bypass RLS)
    const adminSupabase = getSupabaseAdmin();

    // Create project
    const { data: project, error: createError } = await adminSupabase
      .from('projects')
      .insert({
        name,
        description: description || null,
        location,
        budget: budget ? parseFloat(budget) : null,
        start_date: start_date || null,
        estimated_end_date: estimated_end_date || null,
        status: status || 'planning',
        created_by: user.id,
      })
      .select(`
        *,
        created_by_profile:profiles!projects_created_by_fkey(id, full_name, email)
      `)
      .single();

    if (createError) {
      console.error('Error creating project:', createError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: createError.message })
      };
    }

    // Automatically add creator as project member with 'owner' role
    const { error: memberError } = await adminSupabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding creator as project member:', memberError);
      // Don't fail the request, just log the error
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ project })
    };
  } catch (error) {
    console.error('Error in create project function:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
