const { getSupabaseAdmin } = require('../utils/supabase');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const { email, password, full_name, role, company, phone } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Email, password, full_name, and role are required'
        })
      };
    }

    // Validate role
    const validRoles = ['admin', 'project_manager', 'contractor', 'worker'];
    if (!validRoles.includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid role. Must be admin, project_manager, contractor, or worker'
        })
      };
    }

    const supabase = getSupabaseAdmin();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
      user_metadata: {
        full_name,
        role,
        company,
        phone
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Profile is automatically created by the database trigger
    // Fetch the created profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        user: data.user,
        profile: profile || {
          id: data.user.id,
          email,
          full_name,
          role,
          company,
          phone
        },
        message: 'User created successfully'
      })
    };
  } catch (error) {
    console.error('Unexpected signup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
