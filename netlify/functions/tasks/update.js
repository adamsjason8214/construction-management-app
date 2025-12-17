const { getAuthenticatedUser } = require('../utils/supabase');
const { notifyTaskUpdate } = require('../utils/notifications');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PATCH') {
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
    const { task_id, updates } = JSON.parse(event.body);

    if (!task_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'task_id is required' })
      };
    }

    // 3. Get existing task
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*, project_id, assigned_to, status as old_status')
      .eq('id', task_id)
      .single();

    if (fetchError || !existingTask) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Task not found' })
      };
    }

    // 4. Check permissions - user must be assigned to task or be owner/manager
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', existingTask.project_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'You are not a member of this project' })
      };
    }

    const canUpdate =
      existingTask.assigned_to === user.id ||
      ['owner', 'manager'].includes(membership.role);

    if (!canUpdate) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'You do not have permission to update this task'
        })
      };
    }

    // 5. Validate updates
    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'assigned_to',
      'due_date',
      'estimated_hours',
      'actual_hours',
      'depends_on',
      'location'
    ];

    const sanitizedUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    });

    // Set completed_at when status changes to completed
    if (sanitizedUpdates.status === 'completed' && existingTask.old_status !== 'completed') {
      sanitizedUpdates.completed_at = new Date().toISOString();
    }

    // 6. Update task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(sanitizedUpdates)
      .eq('id', task_id)
      .select()
      .single();

    if (updateError) {
      console.error('Task update error:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update task' })
      };
    }

    // 7. Send notifications on status change
    if (sanitizedUpdates.status && sanitizedUpdates.status !== existingTask.old_status) {
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', existingTask.project_id)
        .single();

      // Get project managers to notify
      const { data: managers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', existingTask.project_id)
        .in('role', ['owner', 'manager']);

      if (project && managers && managers.length > 0) {
        const managerIds = managers.map(m => m.user_id).filter(id => id !== user.id);

        if (managerIds.length > 0) {
          const statusMessage = `Task status changed to ${sanitizedUpdates.status}`;
          notifyTaskUpdate(managerIds, updatedTask, project, statusMessage)
            .catch(err => console.error('Failed to send task update notification:', err));
        }
      }
    }

    // 8. Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        task: updatedTask,
        message: 'Task updated successfully'
      })
    };
  } catch (error) {
    console.error('Unexpected error updating task:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
