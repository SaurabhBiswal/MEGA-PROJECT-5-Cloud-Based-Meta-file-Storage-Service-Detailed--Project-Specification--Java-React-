# 🛠️ Technical Challenges & Solutions

Developing and deploying a full-stack Cloud Storage service comes with significant hurdles, especially on free-tier cloud platforms. Here is a summary of the battles we fought and won.

---

## 1. The "Vanishing Files" Battle (Ephemeral Storage)
**Challenge:** Initially, files were stored on the Railway server's local disk. Every time we pushed a code update, Railway would redeploy and **wipe the entire disk**, deleting all user uploads.
**Solution:** Integrated **Supabase Storage (Cloud)**. Files are now streamed directly to the cloud, making them persistent and safe from server redeployments.

## 2. The Great SMTP Blockade (Email)
**Challenge:** Cloud platforms like Railway block outbound SMTP connections (Port 587/465) on free tiers to prevent spam. This made Gmail SMTP impossible to use.
**Solution:** Switched to **SendGrid API** (HTTP-based). By using an API instead of SMTP, we bypassed firewall restrictions.
**Sub-Challenge:** Resend (another service) required domain verification for external emails. 
**Final Fix:** Used SendGrid with **Single Sender Verification** to allow sending from a verified personal email.

## 3. The "CORS" Nightmare
**Challenge:** Connecting a Vercel Frontend to a Railway Backend triggered security blocks. "No Access-Control-Allow-Origin header" errors were common.
**Solution:** Implemented a robust `CorsConfigurationSource` in Spring Security, specifically whitelisting all variations of the Vercel deployment URLs and allowing credentials/headers.

## 4. Railway Memory Crashes (OOM)
**Challenge:** Spring Boot is memory-intensive. Railway's 512MB limit caused the app to crash with "Out of Memory" (OOM) errors during startup.
**Solution:** Configured `JAVA_TOOL_OPTIONS` with `-Xmx300m -Xms256m` to limit the Java Heap size, ensuring the app stays within Railway's limits.

## 5. Vercel 404 on Refresh (SPA Routing)
**Challenge:** Refreshing any page (like `/dashboard`) on Vercel resulted in a "404 Not Found" because the server tried to find a physical file instead of letting React handle the route.
**Solution:** Added `vercel.json` with a **rewrite rule** that redirects all traffic to `index.html`, allowing React Router to take control.

## 6. Localhost vs. Production Links
**Challenge:** Emails sent from the server were hardcoded with `localhost:5173` links, making them useless for the recipient.
**Solution:** Created a configurable `FRONTEND_URL` environment variable. The backend now dynamically generates links pointing to the Vercel production URL.

## 7. Large File Upload Strategy
**Challenge:** Uploading files near 1GB was extremely slow and often timed out. Additionally, files over 400MB caused "Out of Memory" (OOM) crashes on Railway's 512MB RAM tier because the backend loaded the whole file into memory.
**Solution:** 
- Optimized the backend with `Multipart` size limits (2GB).
- **Major Fix:** Refactored the backend to use **Streaming-based uploads** (`MultipartFile.getResource()`) directly to Supabase, bypassing RAM limits.
- **UX Fix:** Implemented **Byte-level Progress Tracking** in the frontend so users can see real-time MB transfer instead of a hanging 0%.

## 8. Cross-Tab Session Conflict (Privacy)
**Challenge:** Using `localStorage` caused the same user session to be shared across all browser tabs. This made it impossible to test multiple accounts in the same browser and felt like a data leak.
**Solution:** Switched to **`sessionStorage`**. Each browser tab now acts as a completely independent sandbox. Opening a new tab requires a separate login, matching the isolation expected from professional apps like Google Drive.

## 9. The 50MB Barrier (Storage Migration)
**Challenge:** We discovered that Supabase Storage Free Tier has a strict **50MB upload limit** per file. This was a dealbreaker for a service designed to handle large multi-modal files (up to 2GB).
**Solution:** Migrated the storage layer to **AWS S3**. This allowed us to support massive file uploads while maintaining high performance and reliability.

## 10. The Shadow Reference Error (Build Refactor)
**Challenge:** During the final production refactor to remove hardcoded localhost URLs, some critical React hooks (`useAuth`, `useNavigate`) were accidentally left unimported in `GoogleLoginButton.jsx`, causing the production site to crash on the login page.
**Solution:** Debugged via the browser console, restored the missing imports, and verified the fix across all authentication components.

---

### **Lessons Learned**
- **Persistence is Key:** Local server storage is for temporary data only.
- **APIs > SMTP:** For cloud deployments, always use HTTP Mail APIs over SMTP.
- **Heap Management:** In restricted RAM environments, manual JVM tuning is mandatory.
- **Storage Scalability:** Check free-tier limits early; S3 is often the better choice for large assets.
- **Reference Integrity:** Always verify imports after a major search-and-replace refactor.
