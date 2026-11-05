interface BrandedEmailOptions {
  academyName: string;
  primaryColor?: string;
  heading: string;
  bodyHtml: string;
}

function layout({ academyName, primaryColor = "#7C3AED", heading, bodyHtml }: BrandedEmailOptions) {
  return `
  <div style="background:#F4F2F8;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(30,20,50,0.08);">
      <div style="background:${primaryColor};padding:28px 32px;">
        <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;opacity:0.85;">${academyName}</p>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">${heading}</h1>
      </div>
      <div style="padding:28px 32px;color:#2b2438;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:18px 32px;border-top:1px solid #EFEAF5;color:#9a93a8;font-size:12px;">
        Mensagem automática enviada por ${academyName}. Se você não reconhece esta ação, ignore este e-mail.
      </div>
    </div>
  </div>`;
}

export function welcomeEmailTemplate(params: {
  academyName: string;
  primaryColor?: string;
  studentName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const { academyName, primaryColor, studentName, email, tempPassword, loginUrl } = params;
  return layout({
    academyName,
    primaryColor,
    heading: "Bem-vindo(a)!",
    bodyHtml: `
      <p>Olá, <b>${studentName}</b>!</p>
      <p>Sua conta na <b>${academyName}</b> foi criada. Use os dados abaixo para acessar o sistema:</p>
      <div style="background:#F7F5FB;border-radius:10px;padding:16px 18px;margin:18px 0;">
        <p style="margin:0 0 6px;"><b>E-mail:</b> ${email}</p>
        <p style="margin:0;"><b>Senha temporária:</b> <span style="font-family:monospace;font-size:16px;letter-spacing:0.02em;">${tempPassword}</span></p>
      </div>
      <p>Por segurança, recomendamos trocar essa senha assim que entrar, em <i>Perfil &gt; Alterar senha</i>.</p>
      <p style="margin-top:22px;">
        <a href="${loginUrl}" style="display:inline-block;background:${primaryColor ?? "#7C3AED"};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Acessar o sistema</a>
      </p>
    `,
  });
}

export function passwordResetEmailTemplate(params: {
  academyName: string;
  primaryColor?: string;
  userName: string;
  resetUrl: string;
}) {
  const { academyName, primaryColor, userName, resetUrl } = params;
  return layout({
    academyName,
    primaryColor,
    heading: "Redefinição de senha",
    bodyHtml: `
      <p>Olá, <b>${userName}</b>.</p>
      <p>Recebemos um pedido para redefinir sua senha na <b>${academyName}</b>. Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
      <p style="margin-top:22px;">
        <a href="${resetUrl}" style="display:inline-block;background:${primaryColor ?? "#7C3AED"};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Redefinir senha</a>
      </p>
      <p style="margin-top:18px;color:#6b6478;font-size:13px;">Se você não pediu essa troca, pode ignorar este e-mail com segurança — sua senha atual continua válida.</p>
    `,
  });
}

export function passwordResetByAdminEmailTemplate(params: {
  academyName: string;
  primaryColor?: string;
  userName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const { academyName, primaryColor, userName, email, tempPassword, loginUrl } = params;
  return layout({
    academyName,
    primaryColor,
    heading: "Sua senha foi redefinida",
    bodyHtml: `
      <p>Olá, <b>${userName}</b>.</p>
      <p>A equipe da <b>${academyName}</b> gerou uma nova senha temporária para o seu acesso:</p>
      <div style="background:#F7F5FB;border-radius:10px;padding:16px 18px;margin:18px 0;">
        <p style="margin:0 0 6px;"><b>E-mail:</b> ${email}</p>
        <p style="margin:0;"><b>Nova senha temporária:</b> <span style="font-family:monospace;font-size:16px;letter-spacing:0.02em;">${tempPassword}</span></p>
      </div>
      <p>Recomendamos trocar essa senha assim que entrar, em <i>Perfil &gt; Alterar senha</i>.</p>
      <p style="margin-top:22px;">
        <a href="${loginUrl}" style="display:inline-block;background:${primaryColor ?? "#7C3AED"};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Acessar o sistema</a>
      </p>
    `,
  });
}
