# 🇱🇰 Lanka Collect Ecosystem
### Modernizing Microfinance Management in Sri Lanka

Lanka Collect is a comprehensive, full-stack fintech solution designed to bridge the gap between field-level debt collection and branch management. This ecosystem replaces manual paperwork with real-time tracking, automated installment scheduling, and deep performance analytics.

---

## 📺 Project Walkthrough
I have prepared a full demonstration of the ecosystem, showing how the **Flutter Mobile App** interacts with the **Node.js Server** and reflects data onto the **React Admin Dashboard** in real-time.
<img width="1855" height="1036" alt="Screenshot 2026-05-07 054529" src="https://github.com/user-attachments/assets/8f2de41d-8add-4b90-bf40-74b04f4f6d76" />

[![Lanka Collect Demo](https://img.youtube.com/vi/LaxM_DouTQQ/maxresdefault.jpg)](https://youtu.be/LaxM_DouTQQ)

> **Note:** The video covers the end-to-end flow: from creating a center and assigning a collector, to field collection with GPS verification and admin performance monitoring.

---

## 🛠 The Ecosystem
To run the full system, you will need to connect all three parts of the environment:

| Repository | Role | Tech Stack |
| :--- | :--- | :--- |
| [**Backend Server**](https://github.com/chathudilzo/lanka_collect_server) | Central API, JWT Auth & MongoDB Logic | Node.js, Express, Mongoose |
| [**Admin Web Portal**](https://github.com/chathudilzo/lanka-collect-web) | Branch Management & Analytics Dashboard | React, Tailwind, Lucide |
| [**Collector Pro App**](https://github.com/chathudilzo/lanka_collect_pro) | Field Tool for GPS-tagged Collections | Flutter, Dart |

---

## ✨ Key Features

### 🏦 Admin Management (Web)
*   **Customer 360 View:** Deep dive into a customer's full financial history and active loan ledgers.
*   **Performance Tracking:** Monitor collectors via "Application Approval Rates" and "Monthly Collection Variance."
*   **Center & Route Logic:** Organise collection points by location, route IDs, and specific meeting days.
*   **Historical Insights:** Built-in seeding logic provides 90 days of historical data for immediate analytical testing.

### 📱 Field Operations (Mobile)
*   **Verified Receipts:** GPS-stamped receipt generation to ensure field transparency.
*   **Instant Loan Applications:** Capture NIC photos and customer data directly from the field for admin review.
*   **Dynamic Collection Lists:** View daily targets based on the assigned center's schedule.

---

## 🚀 Quick Setup

### 1. Server Setup
1. Clone the [Server Repo](https://github.com/chathudilzo/lanka_collect_server).
2. Create a `.env` file with your `MONGO_URI` and `JWT_SECRET`.
3. Run `npm install`.
4. **Crucial:** Run `node src/utils/masterSeed.js` to populate the 90-day historical data.
5. Start the server: `npm start`.

### 2. Web Portal Setup
1. Clone the [Web Repo](https://github.com/chathudilzo/lanka-collect-web).
2. Update the base URL in `src/services/api.js` to your local server address.
3. Run `npm install` and `npm run dev`.

### 3. Mobile App Setup
1. Clone the [Pro App Repo](https://github.com/chathudilzo/lanka_collect_pro).
2. Ensure Flutter is installed.
3. Update the BASE_URL=http://192.168.1.10:3000/api check your ip using ipconfig
4. Run `flutter pub get` and then `flutter run`.

---

## 💡 Developer Perspective
This project was built to solve the real-world transparency issues in localized microfinance. By utilizing a "Master-Detail" UI pattern and a robust 90-day data seeding strategy, the system provides immediate, actionable insights for branch managers to mitigate **Portfolio At Risk (PAR)** from day one.

---
**Developed with ❤️ in Sri Lanka by [Chathudilzo](https://github.com/chathudilzo)**
