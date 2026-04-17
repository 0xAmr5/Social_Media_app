import { EMAIL, EMAIL_FROM_NAME, EMAIL_PASSWORD } from '../../../config/config.service'

type EmailAttachment = {
  filename?: string
  path?: string
  content?: string | Buffer
  contentType?: string
}

type SendMailOptions = {
  attachments?: EmailAttachment[]
}

type NodemailerModule = {
  createTransport(config: {
    service: string
    auth: {
      user: string
      pass: string
    }
  }): {
    sendMail(options: {
      from: string
      to: string
      subject: string
      html: string
      attachments: EmailAttachment[]
    }): Promise<{ accepted: string[]; messageId: string }>
  }
}

type SendEmailParams = {
  to: string
  subject?: string
  html?: string
  attachments?: SendMailOptions['attachments']
}

const loadMailer = (): NodemailerModule => {
  try {
    return require('nodemailer') as NodemailerModule
  } catch {
    throw new Error('nodemailer is not installed')
  }
}

export const sendEmail = async ({
  to,
  subject = '',
  html = '',
  attachments = [],
}: SendEmailParams): Promise<boolean> => {
  if (!EMAIL || !EMAIL_PASSWORD) {
    throw new Error('Email credentials are not configured')
  }

  const transporter = loadMailer().createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL,
      pass: EMAIL_PASSWORD,
    },
  })

  const info = await transporter.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  })

  console.log('Message sent:', info.messageId)
  return info.accepted.length > 0
}

export const generateOtp = (): number => Math.floor(Math.random() * 900000 + 100000)
