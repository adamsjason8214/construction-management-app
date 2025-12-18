const { getSupabaseAdmin, getAuthenticatedUser, getUserProfile } = require('../utils/supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
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
    const { project_id } = body;

    if (!project_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project ID is required' })
      };
    }

    // Check if user is project owner or admin
    const { data: project } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', project_id)
      .single();

    const canDelete = profile.role === 'admin' || project?.created_by === user.id;

    if (!canDelete) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Only project owners and admins can delete projects' })
      };
    }

    // Use admin client to delete project (bypass RLS)
    const adminSupabase = getSupabaseAdmin();

    // Delete project (cascade will handle related records)
    const { error: deleteError } = await adminSupabase
      .from('projects')
      .delete()
      .eq('id', project_id);

    if (deleteError) {
      console.error('Error deleting project:', deleteError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: deleteError.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Project deleted successfully' })
    };
  } catch (error) {
    console.error('Error in delete project function:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
