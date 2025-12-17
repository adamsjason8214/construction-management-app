const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send a single email using SendGrid template
 * @param {string} to - Recipient email address
 * @param {string} templateId - SendGrid template ID
 * @param {object} dynamicTemplateData - Data to populate template
 * @returns {Promise<object>} - SendGrid response
 */
const sendEmail = async ({ to, templateId, dynamicTemplateData }) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    templateId,
    dynamic_template_data: dynamicTemplateData
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`Email sent to ${to} using template ${templateId}`);
    return { success: true, response };
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('SendGrid error body:', error.response.body);
    }
    throw error;
  }
};

/**
 * Send bulk emails to multiple recipients
 * @param {Array<object>} recipients - Array of recipient objects with to, templateId, and dynamicTemplateData
 * @returns {Promise<object>} - SendGrid response
 */
const sendBulkEmail = async (recipients) => {
  const messages = recipients.map(recipient => ({
    to: recipient.to,
    from: process.env.SENDGRID_FROM_EMAIL,
    templateId: recipient.templateId,
    dynamic_template_data: recipient.dynamicTemplateData
  }));

  try {
    const response = await sgMail.send(messages);
    console.log(`Bulk email sent to ${recipients.length} recipients`);
    return { success: true, response };
  } catch (error) {
    console.error('SendGrid bulk error:', error);
    if (error.response) {
      console.error('SendGrid error body:', error.response.body);
    }
    throw error;
  }
};

/**
 * Get template ID for notification type
 */
const getTemplateId = (notificationType) => {
  const templates = {
    project_invite: process.env.SENDGRID_TEMPLATE_ID_PROJECT_INVITE,
    task_assigned: process.env.SENDGRID_TEMPLATE_ID_TASK_ASSIGNED,
    project_update: process.env.SENDGRID_TEMPLATE_ID_PROJECT_UPDATE,
    daily_report: process.env.SENDGRID_TEMPLATE_ID_DAILY_REPORT,
    deadline_reminder: process.env.SENDGRID_TEMPLATE_ID_DEADLINE_REMINDER
  };

  return templates[notificationType];
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  getTemplateId
};
