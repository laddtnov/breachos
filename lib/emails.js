const BASE_URL = 'https://breachos.laddtnov.xyz/';

function emailShell(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#050508;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050508;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#08080f;border:2px solid #00f3ff;border-radius:12px;box-shadow:0 0 30px rgba(0,243,255,0.3);">
        <tr><td style="padding:36px 36px 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:6px;color:rgba(0,243,255,0.5);text-transform:uppercase;">INCOMING TRANSMISSION</p>
          <h1 style="margin:0;font-size:28px;letter-spacing:6px;color:#00f3ff;text-shadow:0 0 20px rgba(0,243,255,0.6);text-transform:uppercase;">BREACH<span style="color:#ff0055;">OS</span></h1>
          <div style="margin:16px auto 0;height:1px;background:linear-gradient(90deg,transparent,#00f3ff,transparent);max-width:300px;"></div>
        </td></tr>
        ${content}
        <tr><td style="padding:0 36px 32px;text-align:center;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,243,255,0.2),transparent);margin-bottom:20px;"></div>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:rgba(0,243,255,0.4);text-transform:uppercase;">The BreachOS Team</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;">breachos.laddtnov.xyz</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function ctaButton(label) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${BASE_URL}" target="_blank"
         style="display:inline-block;padding:14px 32px;background:transparent;color:#00f3ff;border:2px solid #00f3ff;border-radius:6px;font-family:'Courier New',monospace;font-size:13px;font-weight:bold;letter-spacing:3px;text-decoration:none;text-transform:uppercase;">
        ${label}
      </a>
    </td></tr></table>`;
}

export function welcomeEmail(username) {
  return emailShell(`
    <tr><td style="padding:20px 36px 0;text-align:center;">
      <p style="margin:0;font-size:12px;letter-spacing:4px;color:#00ff88;text-transform:uppercase;">▶ IDENTITY CONFIRMED ◀</p>
    </td></tr>
    <tr><td style="padding:28px 36px;">
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(0,243,255,0.85);letter-spacing:1px;">OPERATIVE ${username},</p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">Your Netrunner ID has been registered. Your progress — ranks, skins, achievements, collection cards — now syncs automatically across every device you play on.</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">The net remembers everything.</p>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,243,255,0.3),transparent);margin:0 0 24px;"></div>
      ${ctaButton('▶ BREACH THE SYSTEM')}
    </td></tr>
  `);
}

export function reEngageEmail(username, daysMissing) {
  return emailShell(`
    <tr><td style="padding:20px 36px 0;text-align:center;">
      <p style="margin:0;font-size:12px;letter-spacing:4px;color:#ff0055;text-transform:uppercase;">▶ SIGNAL LOST ◀</p>
    </td></tr>
    <tr><td style="padding:28px 36px;">
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(0,243,255,0.85);letter-spacing:1px;">OPERATIVE ${username},</p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">Your neural link has gone dark. We haven't detected your presence in the net for <strong style="color:#ff0055;">${daysMissing} days</strong>.</p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">Somewhere out there, a daily challenge is waiting. A survival wave hasn't been beaten. A rank hasn't been claimed.</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">The system doesn't forget agents who go quiet. Come back before someone else takes your rank.</p>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,0,85,0.3),transparent);margin:0 0 24px;"></div>
      ${ctaButton('▶ RE-ENTER THE NET')}
    </td></tr>
  `);
}

export function resetEmail(resetUrl) {
  const shell = emailShell(`
    <tr><td style="padding:20px 36px 0;text-align:center;">
      <p style="margin:0;font-size:12px;letter-spacing:4px;color:#ff0055;text-transform:uppercase;">&#9658; ACCESS RECOVERY REQUEST &#9668;</p>
    </td></tr>
    <tr><td style="padding:28px 36px;">
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(0,243,255,0.85);letter-spacing:1px;">AGENT,</p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">A password reset was requested for this Netrunner ID. If this was you, use the link below to set a new access code.</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.5);">If you did not request this, ignore this transmission. Your credentials remain secure.</p>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,0,85,0.3),transparent);margin:0 0 24px;"></div>
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
        <a href="${resetUrl}" target="_blank"
           style="display:inline-block;padding:14px 32px;background:transparent;color:#ff0055;border:2px solid #ff0055;border-radius:6px;font-family:'Courier New',monospace;font-size:13px;font-weight:bold;letter-spacing:3px;text-decoration:none;text-transform:uppercase;">
          &#9658; RESET ACCESS CODE
        </a>
      </td></tr></table>
      <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;letter-spacing:1px;">Link expires in 1 hour. Do not share this with anyone.</p>
    </td></tr>
  `);
  // Override cyan border with red for security emails
  return shell.replace('border:2px solid #00f3ff', 'border:2px solid #ff0055')
              .replace('box-shadow:0 0 30px rgba(0,243,255,0.3)', 'box-shadow:0 0 30px rgba(255,0,85,0.3)');
}
