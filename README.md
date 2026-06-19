This is a [Next.js](https://nextjs.org) app for collecting English to Igbo
education translation and TTS data.

## Auth and Roles

The first workflow slice is implemented:

- MongoDB-backed users
- Password login and registration
- Signed HTTP-only session cookies
- Role-protected pages for Content Admin, Igbo Teacher, Reviewer, Dataset Admin, and Admin
- Admin user-role management at `/admin/users`

The account `chimanwakis@gmail.com` is always treated as the protected super-admin
and receives every role automatically when that email registers or logs in.

Create `.env` from `.env.example`, then replace `MONGODB_URI` with your MongoDB
Atlas connection string.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
If that port is busy, Next.js will print the alternate local URL in the terminal.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses the App Router, TypeScript, ESLint, and Tailwind CSS.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
