# KLB Connect - Enterprise WhatsApp Chatbot 🚀

KLB Connect is a professional-grade WhatsApp automation platform built for **KalaburagiTech**. It features a high-end conversational experience, real-time session management, and a sleek administration dashboard.

## ✨ Key Features

- **Strict Command Trigger**: The bot only responds to the exact phrase: *"Hi I Need KLB Connect Demo"*.
- **Professional Branding**: Automated welcome messages with the high-resolution KalaburagiTech logo and interactive menus.
- **Dynamic Menu System**: Hierarchical flow covering College Projects, App/Web Development, AI Solutions, and Internship Guidance.
- **Real-time Dashboard**: Monitor session status, scan QR codes, and view analytics (Active Sessions, Messages Sent, Leads).
- **Session Stability**: Hardened Puppeteer engine with auto-reconnect and self-healing flow state.
- **Professional Footers**: Automated "0 to Exit" navigation and website linking (`kalaburgitech.com`).

## 🛠️ Tech Stack

- **Frontend**: Next.js 15+, TypeScript, Vanilla CSS (Glassmorphism UI), Socket.io-client.
- **Backend**: Node.js, Express, TypeScript, Puppeteer.
- **WhatsApp Engine**: [WhatsApp-Web.js](https://github.com/pedroslopez/whatsapp-web.js).
- **Database**: MongoDB (Mongoose) for flow and state persistence.
- **Message Queue**: BullMQ & Redis for reliable message delivery.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- Redis (for Message Queue)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kalaburagitech/klb-chat-boot.git
   cd klb-chat-boot
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   # Create .env file with MONGODB_URI, REDIS_URL, etc.
   npm run dev
   ```

3. **Setup Dashboard**:
   ```bash
   cd ../dashboard
   npm install
   # Create .env.local with NEXT_PUBLIC_BACKEND_URL
   npm run dev
   ```

## 📖 How to Use

1. **Link WhatsApp**: Open the dashboard, create a new session, and scan the QR code.
2. **Trigger the Bot**: Send exactly `Hi I Need KLB Connect Demo` to the linked WhatsApp number.
3. **Navigate**: Use numbers `1-5` to explore services.
4. **Exit**: Reply `0` at any time to end the session and receive a thank-you message.

## 🛡️ Security & Stability

- **Puppeteer Sandboxing**: Configured for secure and stable execution on cloud environments (Railway/Heroku).
- **Connection Hardening**: Optimized Mongoose settings to prevent `ECONNRESET` during high load.
- **Media Optimization**: Reliable high-quality image delivery via the automated queue.

---

Built with ❤️ by [KalaburagiTech](https://kalaburgitech.com)
