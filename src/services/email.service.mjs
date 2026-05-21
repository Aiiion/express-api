import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
    const { data, error } = await resend.emails.send({
        from: `System <${process.env.EMAIL_SENDER}>`,
        to: to,
        subject: subject,
        html: html,
    });

    if (error) {
        throw error;
    }

    return data;
}