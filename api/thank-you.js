import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  const at = typeof email === 'string' ? email.indexOf('@') : -1;
  const dot = at > 0 ? email.lastIndexOf('.') : -1;
  const isValidEmail = at > 0 && dot > at + 1 && dot < email.length - 1 && email.length <= 254;

  if (!isValidEmail) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TRANSMISSION RECEIVED</title>
</head>
<body style="margin:0;padding:0;background-color:#050508;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050508;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#08080f;border:2px solid #00f3ff;border-radius:12px;box-shadow:0 0 30px rgba(0,243,255,0.3);">

          <!-- Header -->
          <tr>
            <td style="padding:36px 36px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:6px;color:rgba(0,243,255,0.5);text-transform:uppercase;">INCOMING TRANSMISSION</p>
              <h1 style="margin:0;font-size:28px;letter-spacing:6px;color:#00f3ff;text-shadow:0 0 20px rgba(0,243,255,0.6);text-transform:uppercase;">BREACH<span style="color:#ff0055;">OS</span></h1>
              <div style="margin:16px auto 0;height:1px;background:linear-gradient(90deg,transparent,#00f3ff,transparent);max-width:300px;"></div>
            </td>
          </tr>

          <!-- Status line -->
          <tr>
            <td style="padding:20px 36px 0;text-align:center;">
              <p style="margin:0;font-size:12px;letter-spacing:4px;color:#ff0055;text-transform:uppercase;">▶ SIGNAL AUTHENTICATED ◀</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 36px;">
              <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(0,243,255,0.85);letter-spacing:1px;">
                NETRUNNER,
              </p>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);letter-spacing:0.5px;">
                Your donation has been received and logged in the network. You just fuelled the next upgrade cycle for <strong style="color:#00f3ff;">Cyberpunk Memory Match</strong>.
              </p>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);letter-spacing:0.5px;">
                This game was built from scratch — pure HTML, CSS and JavaScript, zero frameworks, zero shortcuts. Every skin, every sound, every rank was crafted by hand. Your support keeps the system running.
              </p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);letter-spacing:0.5px;">
                The net remembers who funded it.
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,243,255,0.3),transparent);margin:0 0 24px;"></div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://breachos.laddtnov.xyz/" target="_blank"
                       style="display:inline-block;padding:14px 32px;background:transparent;color:#00f3ff;border:2px solid #00f3ff;border-radius:6px;font-family:'Courier New',monospace;font-size:13px;font-weight:bold;letter-spacing:3px;text-decoration:none;text-transform:uppercase;box-shadow:0 0 15px rgba(0,243,255,0.3);">
                      ▶ BREACH THE SYSTEM
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 36px 32px;text-align:center;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,243,255,0.2),transparent);margin-bottom:20px;"></div>
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:rgba(0,243,255,0.4);text-transform:uppercase;">The BreachOS Team</p>
              <p style="margin:0;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;">breachos.laddtnov.xyz</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await resend.emails.send({
      from: 'The BreachOS Team <breachos@laddtnov.xyz>',
      to: email,
      subject: 'TRANSMISSION RECEIVED — BREACH OS',
      html,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send transmission' });
  }
}
