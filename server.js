const express = require("express");
const path = require("path");
const app = express();

// =========================
// Security Headers Middleware
// =========================
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: " +
      "https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com " +
      "https://www.gstatic.com https://cdnjs.cloudflare.com " +
      "https://*.firebasedatabase.app https://*.firebaseio.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob: https://*; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    "connect-src 'self' https://*.firebaseio.com https://*.firebasedatabase.app " +
      "wss://*.firebaseio.com wss://*.firebasedatabase.app " +
      "https://www.gstatic.com https://identitytoolkit.googleapis.com " +
      "https://securetoken.googleapis.com https://*.googleapis.com https://www.googleapis.com; " +
    "frame-src 'self' https://www.google.com https://*.google.com https://*.gstatic.com; " +
    "frame-ancestors 'self'; " +
    "form-action 'self'; " +
    "base-uri 'self';"
  );
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// =========================
// Serve Static Files
// =========================
app.use(express.static(path.join(__dirname, "public")));

// Fallback route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
