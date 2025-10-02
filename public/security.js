const express = require("express");
const path = require("path");
const app = express();

// =========================
// Security Headers Middleware - FIXED FOR FIREBASE
// =========================
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    // Allow Firebase dynamic script loading with wildcards
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://www.gstatic.com https://cdnjs.cloudflare.com https://*.firebasedatabase.app; " +
    // Explicitly set script-src-elem to allow Firebase .lp endpoints
    "script-src-elem 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://www.gstatic.com https://cdnjs.cloudflare.com https://*.firebasedatabase.app; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    // Allow Firebase connections
    "connect-src 'self' https://*.firebaseio.com https://*.firebasedatabase.app https://www.gstatic.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com; " +
    // Allow Google Maps iframe
    "frame-src 'self' https://www.google.com; " +
    "frame-ancestors 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
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
