const twilio = require('twilio');
const logger = require('../utils/logger');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

let twilioClient = null;

// Initialize client if credentials are available
if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
    logger.info('Twilio SMS service initialized');
} else {
    logger.warn('Twilio credentials not configured - SMS will be logged only');
}

/**
 * SMS Notification Service
 */
class SmsService {
    /**
     * Send SMS using Twilio
     * @param {string} to - Recipient phone number
     * @param {string} message - SMS message content
     */
    async sendSMS(to, message) {
        try {
            // In development mode, just log instead of sending (to avoid Twilio trial limitations)
            if (process.env.NODE_ENV === 'development' || process.env.DISABLE_SMS === 'true') {
                logger.info(`📱 SMS (DEV MODE) - To: ${to}`);
                logger.info(`📱 SMS (DEV MODE) - Message: ${message}`);
                return { success: true, mode: 'development' };
            }

            // Send actual SMS via Twilio
            const result = await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });

            logger.info(`SMS sent successfully to ${to}. SID: ${result.sid}`);
            return { success: true, sid: result.sid };
        } catch (error) {
            logger.error('SMS sending failed:', { to, error: error.message });

            // In development, don't fail - just log
            if (process.env.NODE_ENV === 'development') {
                logger.warn('SMS failed in dev mode, continuing anyway');
                return { success: true, mode: 'development', error: error.message };
            }

            throw error;
        }
    }

    /**
     * Send OTP verification SMS
     */
    async sendOTP(phone, otp) {
        const message = `Your RAAHI verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
        return this.sendSMS(phone, message);
    }

    /**
     * Send task posted notification to provider
     */
    async sendTaskPostedNotification(providerPhone, task) {
        const { ai_service_category, ai_price_min, ai_price_max, id } = task;
        const message = `RAAHI: New ${ai_service_category} task nearby! Est. ₹${ai_price_min}-₹${ai_price_max}. Bid now: ${baseUrl}/tasks/${id}`;
        return this.sendSMS(providerPhone, message);
    }

    /**
     * Send new bid notification to customer
     */
    async sendNewBidNotification(customerPhone, bid, task) {
        const { bid_amount, provider_name, rating } = bid;
        const message = `RAAHI: New bid ₹${bid_amount} from ${provider_name} (${rating || 'N/A'}★). View all bids: ${baseUrl}/tasks/${task.id}`;
        return this.sendSMS(customerPhone, message);
    }

    /**
     * Send bid accepted notification to provider
     */
    async sendBidAcceptedNotification(providerPhone, booking, customerName) {
        const message = `RAAHI: Congrats! Your bid accepted. Customer: ${customerName}, Address: ${booking.address || 'See app'}, Time: ${booking.scheduled_time || 'TBD'}`;
        return this.sendSMS(providerPhone, message);
    }

    /**
     * Send bid rejected notification to provider
     */
    async sendBidRejectedNotification(providerPhone, taskId) {
        const message = `RAAHI: Your bid wasn't selected for task #${taskId}. View more tasks nearby: ${baseUrl}/tasks`;
        return this.sendSMS(providerPhone, message);
    }

    /**
     * Send job reminder to provider
     */
    async sendJobReminderNotification(providerPhone, booking, customerName) {
        const message = `RAAHI: Reminder - Job with ${customerName} in 1 hour at ${booking.address || 'See app'}`;
        return this.sendSMS(providerPhone, message);
    }

    /**
     * Send job completed notification to customer
     */
    async sendJobCompletedNotification(customerPhone, providerName) {
        const message = `RAAHI: Job completed! Please rate ${providerName} and confirm payment in the app.`;
        return this.sendSMS(customerPhone, message);
    }

    /**
     * Send payment reminder to customer
     */
    async sendPaymentReminderNotification(customerPhone, amount, taskId) {
        const message = `RAAHI: Payment of ₹${amount} pending for task #${taskId}. Please complete payment.`;
        return this.sendSMS(customerPhone, message);
    }

    /**
     * Send booking confirmation to customer
     */
    async sendBookingConfirmation(customerPhone, booking, providerName, providerPhone) {
        const message = `RAAHI: Booking confirmed! ${providerName} will arrive at ${booking.scheduled_time || 'TBD'}. Contact: ${providerPhone}`;
        return this.sendSMS(customerPhone, message);
    }

    /**
     * Send payment received notification to provider
     */
    async sendPaymentReceivedNotification(providerPhone, amount, taskId) {
        const message = `RAAHI: Payment of ₹${amount} received for task #${taskId}. Keep up the great work!`;
        return this.sendSMS(providerPhone, message);
    }

    /**
     * Bulk send SMS to multiple recipients
     */
    async sendBulkSMS(recipients) {
        const promises = recipients.map(({ phone, message }) =>
            this.sendSMS(phone, message).catch(err => {
                logger.error('Bulk SMS failed for:', { phone, error: err.message });
                return { success: false, phone, error: err.message };
            })
        );

        return Promise.all(promises);
    }
}

module.exports = new SmsService();
