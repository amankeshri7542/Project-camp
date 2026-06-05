import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';

const emailVerificationMailgenContent = (username, verificationURL) => {
    return {
        body: {
            name: username,
            intro: 'Welcome to our app. We are excited to have you on board.',
            action: {
                instructions: 'To verify your email please click on the following button.',
                button: {
                    color: '#22BC66',
                    text: 'Verify your email',
                    link: verificationURL,
                },
            },
            outro: 'Need help or have questions? Just reply to this email, we would love to help.',
        },
    };
};

const forgotPasswordMailgenContent = (username, passwordResetURL) => {
    return {
        body: {
            name: username,
            intro: 'We got a request to reset the password of your account.',
            action: {
                instructions: 'To reset your password, click on the following button.',
                button: {
                    color: '#FF6600',
                    text: 'Reset password',
                    link: passwordResetURL,
                },
            },
            outro: 'Need help or have questions? Just reply to this email, we would love to help.',
        },
    };
};

const sendEmail = async ({ email, subject, mailgenContent }) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Project Camp',
            link: 'https://projectcamp.app',
        },
    });

    const emailHtml = mailGenerator.generate(mailgenContent);
    const emailText = mailGenerator.generatePlaintext(mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILER_HOST,
        port: process.env.MAILER_PORT,
        auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASSWORD,
        },
    });

    const mail = {
        from: `"Project Camp" <${process.env.MAILER_USER}>`,
        to: email,
        subject,
        text: emailText,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error('Email service failed silently. This might have happened because of the credentials. Make sure that you have provided your mailtrap credentials in the .env file.');
        console.error(error);
    }
};

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
};
