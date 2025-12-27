# Deployment Guide: ElectroPrime (Vercel edition)

This project is optimized for a **100% Free** deployment on Vercel without requiring a credit card.

## 1. Prepare for Deployment

- Ensure you have a GitHub repository for your project.
- The project is already configured with `vercel.json` and a serverless bridge in `/api`.

## 2. Deploying on Vercel

1. **Create an account** on [Vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New** > **Project**.
3. Import your GitHub repository.
4. **Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add `ADMIN_PASSWORD` (e.g., `MyUltraSecret123`).
   - Add `NODE_ENV` and set it to `production`.
5. Click **Deploy**.

## 3. Important Notes for Serverless

- **Persistence**: Because this is a free serverless deployment, changes made via the Admin Dashboard (like adding products) will be saved to memory/local JSON but will **reset periodically**. For permanent storage, you should connect a free database (like MongoDB Atlas).
- **Images**: Image uploads are supported for testing, but will also reset periodically. For stable image hosting, use a service like Cloudinary or Imgur.

## 4. Troubleshooting

If the build fails, ensure you are using the latest version of the code where the `package.json` dependency versions were corrected.
