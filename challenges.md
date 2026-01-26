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
**Challenge:** Uploading files near 1GB was extremely slow and often timed out.
**Solution:** Optimized the backend with `Multipart` size limits (2GB) and explained the "Proxying" impact (Browser -> Server -> Cloud). For production, Direct-to-Cloud uploads are the next step.

---

### **Lessons Learned**
- **Persistence is Key:** Local server storage is for temporary data only.
- **APIs > SMTP:** For cloud deployments, always use HTTP Mail APIs over SMTP.
- **Heap Management:** In restricted RAM environments, manual JVM tuning is mandatory.
- **Public Links:** Unifying sharing via public tokens makes for a much smoother user experience.
