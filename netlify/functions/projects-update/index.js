const { getSupabaseAdmin, getAuthenticatedUser, getUserProfile } = require('../utils/supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const { user, supabase } = await getAuthenticatedUser(authHeader);
    const profile = await getUserProfile(user.id, supabase);

    const body = JSON.parse(event.body);
    const { project_id, name, description, location, budget, start_date, estimated_end_date, actual_end_date, status } = body;

    if (!project_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project ID is required' })
      };
    }

    // Check if user is a member of the project
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .single();

    // Check permissions - must be admin, project owner, or project manager
    const canUpdate = profile.role === 'admin' ||
                      membership?.role === 'owner' ||
                      membership?.role === 'manager';

    if (!canUpdate) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to update this project' })
      };
    }

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (budget !== undefined) updates.budget = budget ? parseFloat(budget) : null;
    if (start_date !== undefined) updates.start_date = start_date;
    if (estimated_end_date !== undefined) updates.estimated_end_date = estimated_end_date;
    if (actual_end_date !== undefined) updates.actual_end_date = actual_end_date;
    if (status !== undefined) updates.status = status;

    // Use admin client to update project (bypass RLS)
    const adminSupabase = getSupabaseAdmin();

    // Update project
    const { data: project, error: updateError } = await adminSupabase
      .from('projects')
      .update(updates)
      .eq('id', project_id)
      .select(`
        *,
        created_by_profile:profiles!projects_created_by_fkey(id, full_name, email),
        project_members(
          id,
          role,
          user:profiles(id, full_name, email, avatar_url)
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating project:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: updateError.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ project })
    };
  } catch (error) {
    console.error('Error in update project function:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
