# GoJumpingJack ✈️

A modern flight booking platform that allows users to search, compare, and book flights with ease. Built with Next.js, TypeScript, and integrated with the Duffel API for comprehensive flight data.

🌐 **Live Site**: [www.gojumpingjack.com](https://www.gojumpingjack.com)

## 🚀 Features

### Core Functionality
- **Flight Search**: Real-time flight search with round-trip and one-way options
- **Smart Filtering**: Filter by stops, cabin class, price, and departure times
- **Airport Autocomplete**: Intelligent airport search with IATA code support
- **Asynchronous Processing**: Background job processing for complex searches
- **Real-time Updates**: Live search status updates using Supabase Realtime

### User Experience
- **User Accounts**: Secure registration and authentication system
- **Travel Preferences**: Save home airport, avoided airlines, and default settings
- **Loyalty Programs**: Manage airline loyalty program information
- **Rewards System**: Site rewards token system for frequent users
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Visual Features
- **Dynamic Backgrounds**: Beautiful destination images from Unsplash API
- **Trending Destinations**: Curated list of popular travel destinations
- **Modern UI**: Clean, intuitive interface with smooth animations

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.5 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Custom React components with React Icons
- **Fonts**: Playfair Display, Lobster, Inter, Geist Sans/Mono
- **State Management**: React Context API

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT with bcryptjs
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Queue System**: QStash for background job processing
- **Validation**: Zod schemas

### External APIs
- **Flight Data**: Duffel API for flight booking services
- **Images**: Unsplash API for destination photography
- **Phone Input**: International telephone input library

### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Containerization**: Docker support
- **CI/CD**: Vercel deployment pipeline

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account
- Duffel API account
- Unsplash API account (optional, for images)

## 🔧 Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Duffel API
DUFFEL_TOKEN=your_duffel_api_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret_key

# Unsplash (Optional)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# QStash (for background jobs)
QSTASH_CURRENT_SIGNING_KEY=your_qstash_current_key
QSTASH_NEXT_SIGNING_KEY=your_qstash_next_key

# Vercel Cron (for scheduled tasks)
VERCEL_CRON_SECRET=your_vercel_cron_secret
```

For production, these variables are managed through Vercel's environment settings.

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/LuckyLarryLive/GoJumpingJack.git
   cd GoJumpingJack
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up the database**
   - Create a new Supabase project
   - Run the migrations in the `supabase/migrations/` directory
   - Set up Row Level Security (RLS) policies

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local` (if available)
   - Fill in all required environment variables

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts with travel preferences and loyalty programs
- **duffel_jobs**: Flight search job tracking and status
- **airports**: Cached airport data from Duffel API
- **airline_cache**: Cached airline information
- **city_images**: Cached destination images from Unsplash

### Key Features
- UUID primary keys for security
- JSONB fields for flexible data storage
- Row Level Security (RLS) for data protection
- Automatic timestamp updates
- Indexed fields for performance

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Two-step user registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `POST /api/auth/request-password-reset` - Password reset request
- `POST /api/auth/reset-password` - Password reset completion

### Flight Search
- `GET /api/duffel/test` - Test Duffel API connection
- `GET /api/duffel/test-search` - Test flight search functionality
- `GET /api/duffel/airports` - Get airport data
- `GET /api/duffel/airlines` - Get airline information

### Data Management
- `GET /api/search-airports` - Search airports by query
- `GET/POST /api/sync-airports` - Sync airport data from Duffel
- `GET /api/get-unsplash-image` - Fetch destination images
- `POST /api/track-unsplash-download` - Track image downloads

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### API Testing
Test the Duffel integration:
- Development: `http://localhost:3000/api/duffel/test`
- Production: `https://www.gojumpingjack.com/api/duffel/test`

## 🔄 Flight Search Architecture

### Asynchronous Search Flow
1. **Search Initiation**: User submits search parameters
2. **Job Creation**: Creates background job in `duffel_jobs` table
3. **Edge Function Processing**: Supabase Edge Function handles Duffel API calls
4. **Real-time Updates**: Status updates via Supabase Realtime
5. **Results Display**: Processed flight data displayed to user

### Background Processing
- **QStash Integration**: Reliable job queue for flight searches
- **Error Handling**: Comprehensive error tracking and retry logic
- **Rate Limiting**: Respects Duffel API rate limits
- **Caching**: Intelligent caching of airport and airline data

## 🎨 Component Architecture

### Layout Components
- `Header` - Navigation with authentication state
- `Footer` - Site footer with links
- `ClientLayout` - Wrapper for header/footer structure

### Feature Components
- `SearchSection` - Main flight search interface
- `FlightResults` - Display and filter flight results
- `FlightCard` - Individual flight result display
- `AirportSearchInput` - Airport selection with autocomplete
- `TrendingDestinationsSection` - Popular destinations showcase

### Form Components
- `AirlineSearchInput` - Airline selection interface
- `PhoneInput` - International phone number input
- `LoyaltyProgramsInput` - Airline loyalty program management
- `ProtectedRoute` - Authentication guard component

## 🚀 Deployment

### Production Deployment
The application is automatically deployed to Vercel:
- **URL**: [www.gojumpingjack.com](https://www.gojumpingjack.com)
- **Platform**: Vercel
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t gojumpingjack .

# Run container
docker run -p 3000:3000 gojumpingjack
```

### Environment-Specific Configurations
- **Development**: Uses sandbox Duffel API
- **Production**: Uses live Duffel API with real flight data
- **Staging**: Can be configured for testing with sandbox data

## 📚 Learn More

### Documentation
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Duffel API Documentation](https://duffel.com/docs) - Flight booking API
- [Supabase Documentation](https://supabase.com/docs) - Database and authentication
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling framework

### Related Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write tests for new features
- Follow the existing code structure
- Update documentation as needed

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation and API references

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
