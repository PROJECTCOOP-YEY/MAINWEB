const express = require("express");
const path = require("path");
const app = express();

// =========================
// Security Headers Middleware
// =========================
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://www.gstatic.com https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com; " +
    "font-src 'self' https://cdnjs.cloudflare.com; " +
    "connect-src 'self' https://*.firebaseio.com https://*.firebasedatabase.app https://*.googleapis.com; " +
    "frame-src 'self' https://www.google.com https://*.google.com; " +
    "frame-ancestors 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// =========================
// Serve Static Files
// =========================
app.use(express.static(path.join(__dirname, "public")));

// Fallback (for SPAs, optional)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
