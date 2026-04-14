import { Resend } from 'resend';

export const sendEmail = async (to, subject, html) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

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