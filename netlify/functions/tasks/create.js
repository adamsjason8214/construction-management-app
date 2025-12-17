const { getAuthenticatedUser } = require('../utils/supabase');
const { notifyTaskAssigned } = require('../utils/notifications');

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
    const {
      project_id,
      title,
      description,
      priority = 'medium',
      status = 'todo',
      assigned_to,
      due_date,
      estimated_hours,
      depends_on,
      location
    } = JSON.parse(event.body);

    if (!project_id || !title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'project_id and title are required'
        })
      };
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid priority. Must be low, medium, high, or urgent'
        })
      };
    }

    // 3. Check if user has permission to create tasks in this project
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

    if (!['owner', 'manager', 'contractor'].includes(membership.role)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Only owners, managers, and contractors can create tasks'
        })
      };
    }

    // 4. If assigned_to is provided, verify they are a project member
    if (assigned_to) {
      const { data: assigneeMembership } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', project_id)
        .eq('user_id', assigned_to)
        .single();

      if (!assigneeMembership) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Assigned user is not a member of this project'
          })
        };
      }
    }

    // 5. Create task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id,
        title,
        description,
        priority,
        status,
        assigned_to,
        due_date,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
        depends_on,
        location,
        created_by: user.id
      })
      .select()
      .single();

    if (taskError) {
      console.error('Task creation error:', taskError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create task' })
      };
    }

    // 6. If task is assigned, send notification
    if (assigned_to) {
      // Get project details for notification
      const { data: project } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', project_id)
        .single();

      if (project) {
        notifyTaskAssigned(assigned_to, task, project)
          .catch(err => console.error('Failed to send task notification:', err));
      }
    }

    // 7. Return success response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        task,
        message: 'Task created successfully'
      })
    };
  } catch (error) {
    console.error('Unexpected error creating task:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
