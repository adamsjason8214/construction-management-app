const { getSupabaseAdmin, getAuthenticatedUser, getUserProfile } = require('./utils/supabase');

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
    const { project_id, member_id } = body;

    if (!project_id || !member_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project ID and member ID are required' })
      };
    }

    // Check if user has permission to remove members
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .single();

    const canRemoveMember = profile.role === 'admin' ||
                            membership?.role === 'owner' ||
                            membership?.role === 'manager';

    if (!canRemoveMember) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to remove members from this project' })
      };
    }

    // Use admin client for the following operations
    const adminSupabase = getSupabaseAdmin();

    // Prevent removing the project owner
    const { data: memberToRemove } = await adminSupabase
      .from('project_members')
      .select('role')
      .eq('id', member_id)
      .eq('project_id', project_id)
      .single();

    if (memberToRemove?.role === 'owner') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cannot remove project owner' })
      };
    }

    // Remove member
    const { error: removeError } = await adminSupabase
      .from('project_members')
      .delete()
      .eq('id', member_id)
      .eq('project_id', project_id);

    if (removeError) {
      console.error('Error removing project member:', removeError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: removeError.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Member removed successfully' })
    };
  } catch (error) {
    console.error('Error in remove member function:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
