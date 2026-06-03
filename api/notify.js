import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderDetails } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'kiakkodevs@gmail.com',
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: '"Notificaciones Pulso" <kiakkodevs@gmail.com>',
      to: 'nelsongvr26@gmail.com',
      subject: `🚨 Nuevo Pedido Registrado - ${orderDetails.customer_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">¡Tienes un nuevo pedido!</h2>
          <p>Se ha registrado un nuevo pedido en la plataforma.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>ID Pedido:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${orderDetails.order_id}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Cliente:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${orderDetails.customer_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Teléfono:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${orderDetails.customer_phone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Método de pago:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${orderDetails.payment_method}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc2626; font-weight: bold;">$${orderDetails.total}</td></tr>
          </table>
          
          <h3 style="margin-top: 30px; color: #333;">Productos:</h3>
          <ul style="list-style: none; padding: 0;">
            ${orderDetails.items.map(item => `
              <li style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                <span>${item.quantity}x ${item.title}</span>
                <strong>$${item.price}</strong>
              </li>
            `).join('')}
          </ul>
          
          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            Revisa el panel de Supabase o tu base de datos para más detalles.
          </p>
        </div>
      `
    });

    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
