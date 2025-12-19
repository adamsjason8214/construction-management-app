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
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const { user, supabase } = await getAuthenticatedUser(authHeader);
    const profile = await getUserProfile(user.id, supabase);

    // Check permissions
    if (profile.role !== 'admin' && profile.role !== 'project_manager') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to invite users' })
      };
    }

    const body = JSON.parse(event.body);
    const { email, full_name, role } = body;

    if (!email || !full_name || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, full name, and role are required' })
      };
    }

    const adminSupabase = getSupabaseAdmin();

    // Check if user already exists
    const { data: existingUser } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'User with this email already exists' })
      };
    }

    // INVITE USER (not create with password)
    // This triggers Supabase's "Set password" email
    const redirectUrl = `${process.env.API_URL || 'https://flptconstruction.netlify.app'}/login`;
    console.log('Inviting user with redirectTo:', redirectUrl);

    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name,
        role
      },
      redirectTo: redirectUrl
    });

    if (inviteError) {
      console.error('Error inviting user:', inviteError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: inviteError.message })
      };
    }

    // Create profile (will be linked when user sets password)
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: inviteData.user.id,
        email,
        full_name,
        role
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail - profile will be created by trigger
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User invited successfully',
        user: {
          id: inviteData.user.id,
          email,
          full_name,
          role
        }
      })
    };
  } catch (error) {
    console.error('Error in invite function:', error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
