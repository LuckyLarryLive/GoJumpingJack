# GoJumpingJack

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

The project requires the following environment variables:

- `DUFFEL_TOKEN`: Your Duffel API token (sandbox for development, live for production)
- Other environment variables as required by the project

For local development, create a `.env.local` file in the root directory with these variables.

For production, these variables are managed through Vercel's environment settings.

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

## Flight Booking Integration

This project uses the Duffel API for flight bookings. The integration includes:

- Flight search functionality
- Offer management
- Order creation
- Payment processing

### Testing the Integration

You can test the Duffel integration by visiting:
- Development: `http://localhost:3000/api/duffel/test`
- Production: `https://www.gojumpingjack.com/api/duffel/test`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Duffel API Documentation](https://duffel.com/docs) - learn about Duffel's flight booking API.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The project is deployed on [Vercel](https://vercel.com) at [www.gojumpingjack.com](https://www.gojumpingjack.com).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
