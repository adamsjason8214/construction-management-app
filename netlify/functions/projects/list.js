const { getAuthenticatedUser } = require('../utils/supabase');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
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

    // 2. Parse query parameters
    const params = event.queryStringParameters || {};
    const status = params.status;
    const search = params.search;
    const limit = parseInt(params.limit) || 50;
    const offset = parseInt(params.offset) || 0;

    // 3. Build query - get projects where user is a member
    let query = supabase
      .from('projects')
      .select(`
        *,
        created_by_profile:profiles!created_by(id, full_name, email),
        project_members!inner(
          id,
          role,
          user_id
        )
      `, { count: 'exact' })
      .eq('project_members.user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 4. Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // 5. Execute query
    const { data: projects, error, count } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch projects' })
      };
    }

    // 6. Get member counts for each project
    const projectIds = projects.map(p => p.id);
    const { data: memberCounts } = await supabase
      .from('project_members')
      .select('project_id')
      .in('project_id', projectIds);

    // Count members for each project
    const memberCountMap = {};
    if (memberCounts) {
      memberCounts.forEach(m => {
        memberCountMap[m.project_id] = (memberCountMap[m.project_id] || 0) + 1;
      });
    }

    // 7. Enhance projects with member count
    const enhancedProjects = projects.map(project => ({
      ...project,
      member_count: memberCountMap[project.id] || 0,
      user_role: project.project_members.find(m => m.user_id === user.id)?.role
    }));

    // 8. Return projects
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        projects: enhancedProjects,
        total: count,
        limit,
        offset
      })
    };
  } catch (error) {
    console.error('Unexpected error listing projects:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
