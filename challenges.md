# Project Challenges & Technical Solutions

This document outlines the major technical hurdles encountered during the development of CloudBox and the solutions implemented to resolve them.

## 1. The 4GB Git Repository Disaster
**Problem:**
During the initial development, the `demo/uploads` directory (containing test video files) was accidentally committed to the git repository. This bloated the repository size to **4.5 GB**, causing GitHub to reject pushes with `RPC failed; curl 55 Send failure: Connection was reset`.

**Diagnosis:**
Standard `git push` commands failed because GitHub has a hard limit of 100MB per file and a soft limit on total push size. The `git status` command showed specific large `.mp4` files (e.g., 1.7GB) in the index.

**Solution (The "Nuclear" Reset):**
1.  Executed `git rm -r --cached demo/uploads` to remove files from the index.
2.  Updated `.gitignore` to explicitly exclude `*.mp4`, `*.mkv`, and `demo/uploads/`.
3.  Performed a `git commit --amend` to rewrite the history and remove the large blobs from the commit object.
4.  Forced a push `git push -u origin main --force` to overwrite the corrupted remote history.

## 2. SMTP "Silent Failure" & Registration Rollback
**Problem:**
User registration was failing silently. The `AuthService` attempted to send a "Welcome Email" via Gmail SMTP as part of the registration transaction. When Gmail rejected the credentials (or connection timed out), the entire transaction rolled back, preventing the user created from being saved to the database.

**Solution:**
Implemented a Non-Blocking Email Strategy.
- Wrapped the `emailService.sendEmail()` call in a `try-catch` block within `AuthService`.
- Logged the error but allowed the transaction to proceed.
- Result: Users can now register and login even if the email service is temporarily down.

## 3. Video Streaming & "Content-Disposition"
**Problem:**
Shared video links were forcing a "Download" action instead of playing in the browser. This was due to the `Content-Disposition` header defaulting to `attachment`.

**Solution:**
- Updated `FileController.java` to detect the file's MIME type.
- Changed the header to `Content-Disposition: inline`.
- This allows browsers to render MP4 videos and images natively within the viewer.

## 4. GitHub Secret Scanning Blocks
**Problem:**
GitHub's "Push Protection" blocked the deployment because `application.properties` contained real Google OAuth Client IDs and Secrets.

**Solution:**
- Scrubbed secrets from `application.properties` using `PLACEHOLDER_...` values.
- Used `git commit --amend` to remove the secrets from the commit history to satisfy the security scanner.
