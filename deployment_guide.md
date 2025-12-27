# Deployment Guide: ElectroPrime Online

To move your website online while keeping the Admin section private, follow these simple steps. I recommend using **Render.com** or **Railway.app** as they are the easiest for this type of "Full Stack" (Node.js + React) application.

## 1. Prepare for Deployment

- Ensure you have a GitHub repository for your project.
- Your code is already configured to use environment variables for security.

## 2. Choosing a Provider (Example: Render.com)

1. **Create an account** on [Render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following Build/Start commands:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` (ensure your `package.json` has a start script for the server)
5. **CRITICAL: Set Environment Variables**:
   - Go to the **Environment** tab on Render.
   - Add a key `ADMIN_PASSWORD` and set it to your secret password (e.g., `MyUltraSecret123`).
   - Add `NODE_ENV` and set it to `production`.

## 3. Deployment & Private Testing

- Once deployed, your site will be live at a URL like `my-store.onrender.com`.
- The main site is public for your customers.
- **Accessing Admin**: Go to `my-store.onrender.com/admin`. You will be prompted for the password you set in step 2.

## 4. Iteration Flow

- **Modify**: Make changes locally.
- **Commit**: Push changes to GitHub.
- **Deploy**: The provider (Render/Railway) will automatically detect the changes and rebuild your site.

> [!TIP]
> Always test your `ADMIN_PASSWORD` locally first by editing it in the code or a `.env` file before pushing to production!
