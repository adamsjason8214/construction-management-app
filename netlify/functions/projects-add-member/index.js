const { getSupabaseAdmin, getAuthenticatedUser, getUserProfile } = require('../utils/supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
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
    const { project_id, email, role } = body;

    if (!project_id || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project ID and email are required' })
      };
    }

    // Check if user has permission to add members
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .single();

    const canAddMember = profile.role === 'admin' ||
                         membership?.role === 'owner' ||
                         membership?.role === 'manager';

    if (!canAddMember) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to add members to this project' })
      };
    }

    // Use admin client for the following operations
    const adminSupabase = getSupabaseAdmin();

    // Find user by email
    const { data: targetProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .single();

    if (profileError || !targetProfile) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found with that email' })
      };
    }

    // Check if already a member
    const { data: existingMember } = await adminSupabase
      .from('project_members')
      .select('id')
      .eq('project_id', project_id)
      .eq('user_id', targetProfile.id)
      .single();

    if (existingMember) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User is already a member of this project' })
      };
    }

    // Add member
    const { data: member, error: addError } = await adminSupabase
      .from('project_members')
      .insert({
        project_id,
        user_id: targetProfile.id,
        role: role || 'member',
      })
      .select(`
        id,
        role,
        assigned_at,
        user:profiles(id, full_name, email, avatar_url)
      `)
      .single();

    if (addError) {
      console.error('Error adding project member:', addError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: addError.message })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ member })
    };
  } catch (error) {
    console.error('Error in add member function:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
