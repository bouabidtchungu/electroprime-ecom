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

- **Persistence**: This project is now integrated with **MongoDB Atlas** for permanent storage.
  - You **must** add a new Environment Variable on Vercel: `MONGODB_URI`.
  - Get a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  - Once connected, all changes made via the Admin Dashboard will be permanent.
- **Images**: Image uploads are stored locally on the serverless instance and will still reset periodically. For professional use, integrate an external image host (e.g., Cloudinary).

## 4. Troubleshooting

If the build fails, ensure you are using the latest version of the code where the `package.json` dependency versions were corrected.
