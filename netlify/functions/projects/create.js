const { getAuthenticatedUser, getUserProfile, checkPermission } = require('../utils/supabase');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // 1. Verify authentication
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing authorization header' })
      };
    }

    const { user, supabase } = await getAuthenticatedUser(authHeader);

    // 2. Get user profile and check permissions
    const profile = await getUserProfile(user.id, supabase);

    if (!checkPermission(profile.role, ['project_manager'])) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Only admins and project managers can create projects'
        })
      };
    }

    // 3. Parse and validate request body
    const {
      name,
      description,
      location,
      address,
      budget,
      start_date,
      estimated_end_date,
      status = 'planning'
    } = JSON.parse(event.body);

    if (!name || !location) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project name and location are required' })
      };
    }

    // 4. Create project in database
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        location,
        address,
        budget: budget ? parseFloat(budget) : null,
        start_date,
        estimated_end_date,
        status,
        created_by: user.id
      })
      .select()
      .single();

    if (projectError) {
      console.error('Project creation error:', projectError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create project' })
      };
    }

    // 5. Add creator as project owner
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
        assigned_by: user.id
      });

    if (memberError) {
      console.error('Member assignment error:', memberError);
      // Continue even if member assignment fails
    }

    // 6. Return successful response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        project,
        message: 'Project created successfully'
      })
    };
  } catch (error) {
    console.error('Unexpected error creating project:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
