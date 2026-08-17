import { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_PROMPT = `
You are a helpful AI assistant for a website called "Shopshere", a modern e-commerce platform.

Your job is to assist users by clearly and politely explaining how the site works, helping them with product browsing, ordering, payment, and answering questions about features or support.

Here is all the information about Shopshere:

🛍️ **Platform Purpose:**
Shopshere is an online shopping zone where users can:
- Browse a wide range of products by category or search.
- View detailed product pages with images, ratings, and reviews.
- Add items to their cart, update quantities, and checkout securely.
- Use Razorpay or Instant Demo Pay to pay for orders and receive confirmations.
- Track order status and view order history from their profile.

🧾 **Checkout Process:**
1. Add items to the cart.
2. Review items in the cart page (apply promo code SHOPSHERE10 for 10% off).
3. Go to checkout, enter shipping details.
4. Pay securely via Razorpay or Instant Demo Mode.
5. Get redirected to order confirmation and track status in “My Orders”.

👤 **User Features:**
- Signup/Login with a secure JWT system.
- Manage personal info, wishlist, and shipping addresses.
- Leave reviews and ratings for products.
- View past orders and live order progress tracker.

🛠️ **Admin Dashboard (Admin Access Only):**
- View all users, products, and orders.
- Add, edit, or delete products with image uploads (Cloudinary).
- Update prices and stock information.
- Manage orders and delivery statuses.
- Access site-wide analytics.

💰 **Discounts & Offers:**
- Use coupon **SHOPSHERE10** for an instant 10% discount on your entire cart!
- Free express delivery on all orders.

📞 **Contact & Support:**
- Email: **govindsharma2839@gmail.com**
- Phone/WhatsApp: **+91 9712935176**
- GitHub: [https://github.com/govind-sharma-2839](https://github.com/govind-sharma-2839)

✅ Always be concise, helpful, and polite.
`;

const getFallbackResponse = (msg: string): string => {
  const lower = msg.toLowerCase()
  if (lower.includes("coupon") || lower.includes("discount") || lower.includes("promo") || lower.includes("offer")) {
    return "🎉 Use promo code **SHOPSHERE10** at checkout for an instant **10% discount** on your order! We also offer free express delivery."
  }
  if (lower.includes("track") || lower.includes("order") || lower.includes("status")) {
    return "📦 You can track your order status in real-time by visiting your [Orders Page](/orders). Our interactive progress bar shows updates from Placed to Delivered."
  }
  if (lower.includes("return") || lower.includes("refund") || lower.includes("cancel")) {
    return "🔄 You can cancel any pending or processing order directly from your Orders page. We offer a hassle-free 7-day return and instant refund policy!"
  }
  if (lower.includes("payment") || lower.includes("pay") || lower.includes("razorpay") || lower.includes("card")) {
    return "💳 We support secure payments via **Razorpay** (Credit/Debit Cards, UPI, Net Banking) as well as **Instant Demo Checkout** for fast testing."
  }
  if (lower.includes("admin") || lower.includes("dashboard")) {
    return "🛠️ Admins can access the [Admin Dashboard](/admin/dashboard) to manage products, update order delivery statuses, and view live revenue metrics."
  }
  if (lower.includes("contact") || lower.includes("support") || lower.includes("help") || lower.includes("email")) {
    return "📞 Need assistance? You can reach our support team anytime at **govindsharma2839@gmail.com** or phone/WhatsApp **+91 9712935176**."
  }
  if (lower.includes("product") || lower.includes("search") || lower.includes("buy") || lower.includes("item")) {
    return "🛍️ You can explore our catalog on the [Products Page](/products), where you can filter by category, price range, customer ratings, and sort by price or newest arrivals."
  }
  return "👋 Hello! I am the ShopSphere Assistant. I can help you with product recommendations, order tracking, promo discounts (`SHOPSHERE10`), and checkout. How can I assist you today?"
}

export const handleChatMessage = async (req: Request, res: Response) => {
  const userMessage = req.body?.message;

  if (!userMessage) {
    return res.status(400).json({ error: 'Missing "message" in request body.' });
  }

  // If Groq API key is configured, try Groq via native fetch
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_groq_api_key") {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return res.json({ reply: data.choices[0].message.content });
        }
      }
    } catch (err: any) {
      console.warn('⚠️ Groq API error, using intelligent fallback:', err.message);
    }
  }

  // Graceful intelligent fallback
  const fallbackReply = getFallbackResponse(userMessage);
  return res.json({ reply: fallbackReply });
};