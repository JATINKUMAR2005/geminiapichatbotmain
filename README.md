## 🤖 Overview

A modern, full-stack AI chatbot application built with Next.js 15, featuring real-time conversations powered by Groq's lightning-fast AI models. The application includes user authentication, persistent conversation history, and a beautiful, responsive interface designed for optimal user experience.

## ✨ Features

- **🚀 Lightning-Fast AI Responses** - Powered by Groq's high-performance AI infrastructure
- **💬 Real-time Chat Interface** - Smooth, responsive chat experience with typing indicators
- **🔐 User Authentication** - Secure sign-up and login with Supabase Auth
- **📚 Conversation History** - Persistent chat storage with conversation management
- **🎨 Modern UI/UX** - Clean, professional design with dark/light mode support
- **📱 Fully Responsive** - Optimized for desktop, tablet, and mobile devices
- **🔒 Secure & Private** - Row-level security ensures users only access their own data
- **⚡ Performance Optimized** - Memoized components and efficient rendering
- **🎯 Code Formatting** - Intelligent code block detection with syntax highlighting

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Lucide React** - Modern icon library

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - User authentication and authorization
- **Row Level Security (RLS)** - Database-level security policies

### AI Integration
- **Groq API** - Ultra-fast AI inference
- **AI SDK** - Vercel's AI toolkit for streaming responses

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Groq API key

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/geminiapichatbotmain.git
   cd geminiapichatbotmain
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   \`\`\`env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Groq API
   GROQ_API_KEY=your_groq_api_key
   
   # Development (optional)
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
   \`\`\`

4. **Set up the database**
   
   Run the SQL scripts in your Supabase SQL editor:
   \`\`\`bash
   # Execute scripts/001_create_chat_tables.sql
   # Execute scripts/002_create_profile_trigger.sql
   \`\`\`

5. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # Chat API endpoint
│   │   └── conversations/        # Conversation management
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── sign-up-success/
│   ├── chat/                     # Chat interface page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── chat-demo.tsx             # Main chat interface
│   ├── hero.tsx                  # Landing page hero
│   ├── features.tsx              # Features section
│   └── ...                       # Other components
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client configuration
│   └── utils.ts                  # Utility functions
├── scripts/                      # Database scripts
│   ├── 001_create_chat_tables.sql
│   └── 002_create_profile_trigger.sql
└── hooks/                        # Custom React hooks
\`\`\`

## 🗄️ Database Schema

### Tables

**profiles**
- `id` (UUID, Primary Key)
- `email` (Text)
- `full_name` (Text)
- `avatar_url` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**conversations**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `title` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**messages**
- `id` (UUID, Primary Key)
- `conversation_id` (UUID, Foreign Key)
- `content` (Text)
- `role` (Text: 'user' | 'assistant')
- `created_at` (Timestamp)

**ai_memory**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `key` (Text)
- `value` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 🔧 Configuration

### Groq Models
The application uses Groq's `llama-3.1-70b-versatile` model by default. You can modify the model in `app/api/chat/route.ts`:

\`\`\`typescript
const result = await streamText({
  model: groq('llama-3.1-70b-versatile'), // Change model here
  // ...
})
\`\`\`

### Supabase Configuration
Row Level Security (RLS) policies ensure data privacy:
- Users can only access their own conversations and messages
- Authentication is required for all database operations
- Automatic profile creation on user registration

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your app

### Manual Deployment

1. **Build the application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start the production server**
   \`\`\`bash
   npm start
   \`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://vercel.com/jatin787829-9645s-projects/v0-geminiapichatbotmain](https://vercel.com/jatin787829-9645s-projects/v0-geminiapichatbotmain)
- **v0.app Project**: [https://v0.app/chat/projects/HZMg6ZPTBJc](https://v0.app/chat/projects/HZMg6ZPTBJc)
- **Groq Documentation**: [https://console.groq.com/docs](https://console.groq.com/docs)
- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/geminiapichatbotmain/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---
