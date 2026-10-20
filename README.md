<div align="center">
  <h1>🪺 DealNest</h1>
  <p><strong>The best deals in your street, all in one nest.</strong></p>
  
  <p>DealNest is South Africa's local deals marketplace. Local stores publish their real promotions. Shoppers browse, save, and claim a voucher code, then show it in-store. No coupon hunting, no expired printouts.</p>

  <!-- Badges -->
  <a href="https://react-frontend-eplq.onrender.com/" target="_blank">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-Visit_DealNest-00875A?style=for-the-badge&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Frontend-JavaScript_/_React-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Spring_Boot_Java-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-Supabase-2496ED?style=for-the-badge&logo=supabase&logoColor=green" alt="Supabase" />
  <img src="https://img.shields.io/badge/Deployment-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</div>

---

## 📸 Platform Showcase

<div align="center">
  <img width="1917" height="1032" alt="image" src="https://github.com/user-attachments/assets/2a4d5349-16f1-416b-9157-d4a2282810f8" />
</div>

---

## ✨ Why DealNest?

We've eliminated the friction of traditional coupon clipping. DealNest works for **both sides of the counter**:

*   🛍️ **For Shoppers:** Find and redeem real-time deals. One tap generates a unique voucher code tied to the promotion. Track your total savings, build streaks, and earn points.
*   🏪 **For Stores:** Publish, edit, and expire promotions yourself. Get a full analytics dashboard to track views, saves, claims, and redemptions. No more guessing if a print-out worked.

## 🚀 Key Features

Based on our platform design, DealNest offers:

*   **Seamless Browsing:** Search by product, store, city, or category (Grocery, Pharmacy, Fashion, Electronics, Restaurants, Beauty, Home).
*   **Voucher System:** Claim unique codes (e.g., `DR5H-V9MZ`) and redeem them instantly in-store via the cashier dashboard.
*   **Smart Filtering:** Filter by rating, deals only, distance, and budget ceiling.
*   **Store Dashboard & Analytics:** A "Pro" dashboard for store owners to track conversion rates, views, claims, and redeemed codes in real-time.
*   **Tiered Pricing Models:** 
    *   **Free (R0):** Basic browsing and saving.
    *   **DealNest Plus (R49/mo):** Unlimited saved deals, price-drop alerts, and personalization.
    *   **Pro (R199/mo):** Full analytics, bulk CSV uploads, and featured flags for stores.

---

## 🛠️ Tech Stack

| Architecture | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, Vanilla JavaScript, HTML/CSS (Modern UI with custom teal/green branding) |
| **Backend** | Java, Spring Boot, Maven |
| **Testing** | **JUnit 5** (Unit & Integration Testing) |
| **Database** | Supabase PostgreSQL |
| **DevOps** | Docker, Docker Compose, GitHub Actions |
| **Hosting** | Render (Frontend & Backend) |

---

## 📂 Project Structure & Architecture

DealNest follows a scalable, layered architecture to ensure clean separation of concerns between the frontend and backend.

```text
DealNest/
├── .github/workflows/       # GitHub Actions (CI/CD pipelines)
├── backend/                 # Spring Boot Java Application
│   ├── dealnest/            # Main Backend Module
│   │   ├── src/
│   │   │   ├── main/java/za/ac/cput/dealnest/
│   │   │   │   ├── config/      # Configuration classes (Security, CORS, Beans)
│   │   │   │   ├── controller/  # REST API Endpoints
│   │   │   │   ├── domain/      # Database Entities (JPA/Hibernate)
│   │   │   │   ├── dto/         # Data Transfer Objects (Request/Response payloads)
│   │   │   │   ├── factory/     # Factory patterns for complex object creation
│   │   │   │   ├── repository/  # Spring Data JPA Interfaces (DB queries)
│   │   │   │   ├── scheduler/   # Cron jobs (e.g., expiring deals, sending alerts)
│   │   │   │   ├── security/    # JWT, Authentication & Authorization logic
│   │   │   │   ├── service/     # Core Business Logic
│   │   │   │   └── util/        # Helper classes (e.g., Voucher code generators)
│   │   │   └── test/java/za/ac/cput/dealnest/  # JUnit Tests
│   │   ├── Dockerfile           # Backend containerization
│   │   ├── pom.xml              # Maven dependencies
│   │   └── render.yaml          # Render deployment configuration
├── frontend/                # React/JavaScript Frontend
│   ├── dealnest/            # Main Frontend Module
│   │   ├── public/          # Static assets (index.html, icons)
│   │   ├── src/             # React Source Code
│   │   │   ├── assets/      # Images, fonts, and global styles
│   │   │   ├── components/  # Reusable UI components (Buttons, Cards, Navbars)
│   │   │   ├── constants/   # Static data, API routes, category lists
│   │   │   ├── hooks/       # Custom React Hooks (e.g., useAuth, useFetch)
│   │   │   ├── lib/         # Third-party library configurations
│   │   │   ├── pages/       # Page-level components (Home, Pricing, Dashboard)
│   │   │   ├── services/    # API call functions connecting to the Spring Boot backend
│   │   │   ├── App.jsx      # Main application component & routing
│   │   │   └── main.jsx     # React entry point
│   │   ├── .env             # Environment variables
│   │   ├── .oxlintrc.json   # Linting configuration
│   │   └── package.json     # NPM dependencies
├── docs/                    # Documentation, UML diagrams, and screenshots
├── docker-compose.yml       # Orchestrates both frontend and backend
└── README.md                # You are here!
