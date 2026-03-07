import { LocalNotifications } from '@capacitor/local-notifications';
import { storageService } from './storage';

export const CART_REMINDER_ID = 1001;

export const NotificationService = {
    requestPermissions: async () => {
        const { display } = await LocalNotifications.checkPermissions();
        if (display !== 'granted') {
            await LocalNotifications.requestPermissions();
        }
    },

    scheduleCartReminder: async () => {
        const prefs = storageService.getNotificationPrefs();
        if (!prefs.cartReminders) return;

        // Fire 15 seconds from now (for testing)
        const scheduleDate = new Date(Date.now() + 15000);

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Items left behind! 🏃',
                    body: 'Your cart misses you. Check out now to secure your gear.',
                    id: CART_REMINDER_ID,
                    schedule: { at: scheduleDate },
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#e43928'
                }
            ]
        });
    },

    cancelCartReminder: async () => {
        await LocalNotifications.cancel({
            notifications: [{ id: CART_REMINDER_ID }]
        });
    },

    scheduleMileageAlert: async (shoeName: string, currentMiles: number, limit: number) => {
        const prefs = storageService.getNotificationPrefs();
        if (!prefs.mileageAlerts) return;

        // Generate a fast pseudo-random ID for this alert so multiple shoes don't override each other
        const alertId = Math.floor(Math.random() * 100000) + 2000;

        let title = 'Mileage Warning ⚠️';
        let body = `${shoeName} is at ${currentMiles.toFixed(0)} miles — nearly at its ${limit}mi limit!`;

        if (currentMiles >= limit) {
            title = 'Time for new shoes! 🎉';
            body = `Your ${shoeName} hit ${limit}mi! Show your mileage in store to enjoy 15% off a new pair.`;
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: alertId,
                    schedule: { at: new Date(Date.now() + 5000) }, // Fire in 5 seconds
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#e43928'
                }
            ]
        });
    },

    schedulePostRunCongrats: async (miles: number) => {
        const prefs = storageService.getNotificationPrefs();
        if (!prefs.runLogCongrats) return;

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Great run today! 🏅',
                    body: `You logged ${miles.toFixed(1)} miles. Rest up and recover!`,
                    id: Math.floor(Math.random() * 100000) + 3000,
                    // Fire 30s from now for testing (ideally 2-3 hours after)
                    schedule: { at: new Date(Date.now() + 30000) },
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#f59e0b' // amber
                }
            ]
        });
    },

    scheduleEventReminder: async (eventName: string) => {
        const prefs = storageService.getNotificationPrefs();
        if (!prefs.eventReminders) return;

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: 'Upcoming Group Run 🏃‍♂️',
                    body: `Don't forget: ${eventName} is coming up soon!`,
                    id: Math.floor(Math.random() * 100000) + 4000,
                    // Fire 20s from now for testing (ideally ~2 hours before event)
                    schedule: { at: new Date(Date.now() + 20000) },
                    smallIcon: 'ic_stat_icon_config_sample',
                    iconColor: '#3b82f6' // blue
                }
            ]
        });
    }
};
