import * as PusherPushNotifications from '@pusher/push-notifications-web';

let beamsClient = null;

/**
 * Initialize Pusher Beams for the authenticated user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} - The initialized Beams client
 */
export const initializePusherBeams = async (userId) => {
  if (!import.meta.env.VITE_PUSHER_INSTANCE_ID) {
    console.error('Missing Pusher Beams instance ID');
    return null;
  }

  try {
    if (!beamsClient) {
      beamsClient = new PusherPushNotifications.Client({
        instanceId: import.meta.env.VITE_PUSHER_INSTANCE_ID
      });
    }

    await beamsClient.start();
    console.log('Pusher Beams client started');

    // Set user ID for authenticated notifications
    if (userId) {
      const beamsTokenProvider = new PusherPushNotifications.TokenProvider({
        url: `${import.meta.env.VITE_API_URL || ''}/api/pusher/auth`,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sb-access-token')}`
        }
      });

      await beamsClient.setUserId(userId, beamsTokenProvider);
      console.log('Pusher Beams user ID set:', userId);
    }

    return beamsClient;
  } catch (error) {
    console.error('Failed to initialize Pusher Beams:', error);
    return null;
  }
};

/**
 * Subscribe to a specific interest/topic
 * @param {string} interest - The interest to subscribe to (e.g., 'project-123')
 */
export const subscribeToPush = async (interest) => {
  if (!beamsClient) {
    console.error('Beams client not initialized');
    return;
  }

  try {
    await beamsClient.addDeviceInterest(interest);
    console.log(`Subscribed to interest: ${interest}`);
  } catch (error) {
    console.error('Failed to subscribe to interest:', error);
  }
};

/**
 * Unsubscribe from a specific interest/topic
 * @param {string} interest - The interest to unsubscribe from
 */
export const unsubscribeFromPush = async (interest) => {
  if (!beamsClient) {
    console.error('Beams client not initialized');
    return;
  }

  try {
    await beamsClient.removeDeviceInterest(interest);
    console.log(`Unsubscribed from interest: ${interest}`);
  } catch (error) {
    console.error('Failed to unsubscribe from interest:', error);
  }
};

/**
 * Stop the Beams client
 */
export const stopPusherBeams = async () => {
  if (beamsClient) {
    try {
      await beamsClient.stop();
      beamsClient = null;
      console.log('Pusher Beams client stopped');
    } catch (error) {
      console.error('Failed to stop Pusher Beams:', error);
    }
  }
};

/**
 * Get the current Beams client instance
 */
export const getBeamsClient = () => beamsClient;

/**
 * Check if push notifications are supported
 */
export const isPushSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};
