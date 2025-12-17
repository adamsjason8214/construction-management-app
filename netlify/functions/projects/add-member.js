const { getAuthenticatedUser, getUserProfile } = require('../utils/supabase');
const { notifyProjectInvite } = require('../utils/notifications');

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

    // 2. Parse request body
    const { project_id, user_id, role = 'worker' } = JSON.parse(event.body);

    if (!project_id || !user_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'project_id and user_id are required'
        })
      };
    }

    // Validate member role
    const validRoles = ['owner', 'manager', 'contractor', 'worker', 'viewer'];
    if (!validRoles.includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid role. Must be owner, manager, contractor, worker, or viewer'
        })
      };
    }

    // 3. Check if current user is owner/manager of the project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'You are not a member of this project' })
      };
    }

    if (!['owner', 'manager'].includes(membership.role)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Only project owners and managers can add members'
        })
      };
    }

    // 4. Check if user being added exists
    const { data: newMember, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user_id)
      .single();

    if (userError || !newMember) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // 5. Add user to project
    const { data: addedMember, error: addError } = await supabase
      .from('project_members')
      .insert({
        project_id,
        user_id,
        role,
        assigned_by: user.id
      })
      .select()
      .single();

    if (addError) {
      if (addError.code === '23505') { // Unique constraint violation
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'User is already a member of this project' })
        };
      }
      console.error('Error adding member:', addError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to add member to project' })
      };
    }

    // 6. Get project details for notification
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', project_id)
      .single();

    // 7. Get inviter name for notification
    const inviterProfile = await getUserProfile(user.id, supabase);

    // 8. Send notification (async, don't wait)
    if (project && inviterProfile) {
      notifyProjectInvite(user_id, project, inviterProfile.full_name)
        .catch(err => console.error('Failed to send notification:', err));
    }

    // 9. Return success response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        member: {
          ...addedMember,
          user: newMember
        },
        message: 'Member added successfully'
      })
    };
  } catch (error) {
    console.error('Unexpected error adding member:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
