const PushNotifications = require('@pusher/push-notifications-server');
const { sendEmail, getTemplateId } = require('./sendgrid');
const { getSupabaseAdmin } = require('./supabase');

// Initialize Pusher Beams client
const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID,
  secretKey: process.env.PUSHER_SECRET_KEY
});

/**
 * Send notifications to users (push, email, and database)
 * @param {Array<string>} userIds - Array of user IDs to notify
 * @param {object} notification - Notification details
 * @returns {Promise<object>} - Result with counts
 */
const notifyUsers = async (userIds, notification) => {
  const supabase = getSupabaseAdmin();

  try {
    // Fetch user profiles and preferences
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, notification_preferences')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users found to notify');
      return { success: true, notified: 0 };
    }

    // Create database notifications for all users
    const dbNotifications = userIds.map(userId => ({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      project_id: notification.project_id,
      task_id: notification.task_id
    }));

    const { error: dbError } = await supabase
      .from('notifications')
      .insert(dbNotifications);

    if (dbError) {
      console.error('Error creating database notifications:', dbError);
    }

    // Send push notifications to users who have push enabled
    const pushUsers = profiles.filter(
      p => p.notification_preferences?.push !== false
    );

    if (pushUsers.length > 0) {
      try {
        await beamsClient.publishToUsers(
          pushUsers.map(u => u.id),
          {
            web: {
              notification: {
                title: notification.title,
                body: notification.message,
                icon: '/icon-192.png',
                deep_link: notification.link || '/',
                data: {
                  project_id: notification.project_id,
                  task_id: notification.task_id
                }
              }
            }
          }
        );
        console.log(`Push notifications sent to ${pushUsers.length} users`);
      } catch (pushError) {
        console.error('Pusher Beams error:', pushError);
        // Don't fail the whole operation if push fails
      }
    }

    // Send email notifications to users who have email enabled
    const emailUsers = profiles.filter(
      p => p.notification_preferences?.email !== false
    );

    if (emailUsers.length > 0 && notification.emailTemplate) {
      try {
        const emailPromises = emailUsers.map(user =>
          sendEmail({
            to: user.email,
            templateId: notification.emailTemplate,
            dynamicTemplateData: {
              ...notification.emailData,
              user_name: user.full_name
            }
          }).catch(err => {
            console.error(`Failed to send email to ${user.email}:`, err);
            return null;
          })
        );

        await Promise.allSettled(emailPromises);
        console.log(`Email notifications sent to ${emailUsers.length} users`);
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the whole operation if email fails
      }
    }

    return {
      success: true,
      notified: userIds.length,
      push_sent: pushUsers.length,
      email_sent: emailUsers.length
    };
  } catch (error) {
    console.error('Notification error:', error);
    throw error;
  }
};

/**
 * Notify user about project invitation
 */
const notifyProjectInvite = async (userId, project, inviterName) => {
  const appUrl = process.env.VITE_API_URL || 'http://localhost:5173';

  await notifyUsers([userId], {
    type: 'project_invite',
    title: 'Project Invitation',
    message: `${inviterName} invited you to ${project.name}`,
    link: `/projects/${project.id}`,
    project_id: project.id,
    emailTemplate: getTemplateId('project_invite'),
    emailData: {
      project_name: project.name,
      inviter_name: inviterName,
      project_link: `${appUrl}/projects/${project.id}`,
      role: 'team member'
    }
  });
};

/**
 * Notify user about task assignment
 */
const notifyTaskAssigned = async (userId, task, project) => {
  const appUrl = process.env.VITE_API_URL || 'http://localhost:5173';

  await notifyUsers([userId], {
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You've been assigned: ${task.title}`,
    link: `/projects/${project.id}/tasks?task=${task.id}`,
    project_id: project.id,
    task_id: task.id,
    emailTemplate: getTemplateId('task_assigned'),
    emailData: {
      task_title: task.title,
      task_description: task.description || 'No description provided',
      project_name: project.name,
      due_date: task.due_date || 'No due date',
      priority: task.priority,
      task_link: `${appUrl}/projects/${project.id}/tasks?task=${task.id}`
    }
  });
};

/**
 * Notify project members about project update
 */
const notifyProjectUpdate = async (memberIds, project, updateMessage, updateType = 'general') => {
  const appUrl = process.env.VITE_API_URL || 'http://localhost:5173';

  await notifyUsers(memberIds, {
    type: 'project_updated',
    title: 'Project Update',
    message: `${project.name}: ${updateMessage}`,
    link: `/projects/${project.id}`,
    project_id: project.id,
    emailTemplate: getTemplateId('project_update'),
    emailData: {
      project_name: project.name,
      update_type: updateType,
      update_message: updateMessage,
      project_link: `${appUrl}/projects/${project.id}`
    }
  });
};

/**
 * Notify about upcoming task deadline
 */
const notifyDeadlineReminder = async (userId, task, project, daysRemaining) => {
  const appUrl = process.env.VITE_API_URL || 'http://localhost:5173';

  await notifyUsers([userId], {
    type: 'deadline_reminder',
    title: 'Task Deadline Reminder',
    message: `${task.title} is due in ${daysRemaining} days`,
    link: `/projects/${project.id}/tasks?task=${task.id}`,
    project_id: project.id,
    task_id: task.id,
    emailTemplate: getTemplateId('deadline_reminder'),
    emailData: {
      task_title: task.title,
      project_name: project.name,
      due_date: task.due_date,
      days_remaining: daysRemaining,
      task_link: `${appUrl}/projects/${project.id}/tasks?task=${task.id}`
    }
  });
};

/**
 * Notify about task status change
 */
const notifyTaskUpdate = async (memberIds, task, project, updateMessage) => {
  await notifyUsers(memberIds, {
    type: 'task_updated',
    title: 'Task Updated',
    message: `${task.title}: ${updateMessage}`,
    link: `/projects/${project.id}/tasks?task=${task.id}`,
    project_id: project.id,
    task_id: task.id
  });
};

module.exports = {
  notifyUsers,
  notifyProjectInvite,
  notifyTaskAssigned,
  notifyProjectUpdate,
  notifyDeadlineReminder,
  notifyTaskUpdate
};
