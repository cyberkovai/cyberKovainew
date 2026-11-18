import axios from 'axios';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { storageService } from './storageService.js';

dotenv.config();

export const contactService = {
  async processContact(body, clientIp) {
    // 1. Honeypot check
    if (body.website || body.hp_time) {
      return { success: false, message: 'Spam submission detected.' };
    }

    // 2. Sanitize and trim
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    let service = String(body.service || body.service_interest || '').trim();
    const message = String(body.message || '').trim();
    const recaptchaToken = body['g-recaptcha-response'] || body.recaptchaToken;

    // Handle "Other" custom service requirement
    if (/^other/i.test(service)) {
      const otherService = String(body.service_other || '').trim();
      if (!otherService) {
        return { success: false, message: 'Please specify the service you require.' };
      }
      service = `Other: ${otherService}`;
    }

    // Validations
    if (!name) return { success: false, message: 'Please enter your name or pseudonym.' };
    if (name.length > 120) return { success: false, message: 'Name is too long (maximum 120 characters).' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 150) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    if (!phone) return { success: false, message: 'Please provide your phone, WhatsApp, or Signal number.' };
    if (phone.length < 7 || phone.length > 35) {
      return { success: false, message: 'Please provide a valid contact number (7 to 35 characters).' };
    }

    if (!service) return { success: false, message: 'Please select the service required.' };
    if (service.length > 150) return { success: false, message: 'Selected service name is invalid.' };

    if (!message) return { success: false, message: 'Please provide your confidential details or message.' };
    if (message.length > 4000) return { success: false, message: 'Message is too long (maximum 4000 characters).' };

    // 3. reCAPTCHA verification if enabled
    const enableRecaptcha = String(process.env.ENABLE_RECAPTCHA).toLowerCase() === 'true';
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

    if (enableRecaptcha && recaptchaSecret) {
      if (!recaptchaToken) {
        return { success: false, message: 'Please complete the reCAPTCHA verification.' };
      }
      try {
        const verifyRes = await axios.post(
          'https://www.google.com/recaptcha/api/siteverify',
          new URLSearchParams({
            secret: recaptchaSecret,
            response: recaptchaToken,
            remoteip: clientIp || '',
          }).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (!verifyRes.data || !verifyRes.data.success) {
          return { success: false, message: 'reCAPTCHA verification failed. Please try again.' };
        }
      } catch (err) {
        console.error('reCAPTCHA error:', err.message);
        return { success: false, message: 'reCAPTCHA verification error. Please try again.' };
      }
    }

    // 4. Always persist lead locally / in Supabase database first so it is never lost
    const savedLead = await storageService.saveLead({
      name,
      email,
      phone,
      service,
      message,
      ip: clientIp,
      sheet_synced: false,
    });

    // 5. Submit Lead to Google Sheets via Google Apps Script Web App
    const scriptUrl =
      process.env.GOOGLE_SCRIPT_URL ||
      'https://script.google.com/macros/s/AKfycbxCF61hcrOSjTVht96TrymhNCjzLCRPyeRByyD4t1OYRy96c6SMkjqyh-PLnsR_3zztfA/exec';
    const scriptSecret = process.env.GOOGLE_SHEETS_SECRET || '';

    const leadPayload = {
      token: scriptSecret,
      name,
      email,
      phone,
      service,
      message,
    };

    let sheetSuccess = false;

    try {
      const sheetRes = await axios.post(scriptUrl, leadPayload, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        timeout: 10000,
        maxRedirects: 5,
      });

      if (sheetRes.data && (sheetRes.data.success === true || sheetRes.data.status === 'success')) {
        sheetSuccess = true;
        await storageService.updateLeadSheetSynced(savedLead.id, true);
      }
    } catch (err) {
      console.warn('Google Sheets background sync notice:', err.message);
    }

    // 6. Send backup notification email
    const settings = await storageService.getSettings();
    const siteEmail = settings.site_email || 'info@cyberkovai.com';

    try {
      const transporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail',
      });

      const mailOptions = {
        from: `"Cyber Kovai Website" <noreply@cyberkovai.com>`,
        to: siteEmail,
        replyTo: `"${name}" <${email}>`,
        subject: `New Confidential Lead from ${name} [${service || 'General Inquiry'}]`,
        text: `You have received a new confidential lead on your website (recorded to Google Sheets):\n\nName / Pseudonym: ${name}\nEmail: ${email}\nPhone: ${phone}\nService Required: ${service || 'General Inquiry'}\nTimestamp: ${new Date().toISOString()}\n\nConfidential Details / Message:\n${message}\n`,
      };

      transporter.sendMail(mailOptions, () => {});
    } catch (e) {
      // Non-blocking email fallback
    }

    return {
      success: true,
      message: 'Thank you! Your confidential enquiry has been received and recorded. Our team will contact you shortly.',
    };
  },
};

