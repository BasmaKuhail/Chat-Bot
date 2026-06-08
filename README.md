This project is a full-stack AI-powered chat application built with modern web technologies. It provides a conversational interface where users can interact with an AI assistant in real time.

The application is designed to evolve from a simple chat interface into a more advanced system that can understand and respond based on user-provided data using Retrieval-Augmented Generation (RAG).

🚀 Features
💬 Interactive chat interface
⚡ Real-time AI responses
🔄 Message-based conversation flow
⏳ Loading and error handling states
📱 Responsive, full-screen layout

Tech Stack:
Next.js 
React
AI API (LLMs)
Tailwind CSS 

Database design: https://dbdiagram.io/d/chatbot-6a1b362af15b4b0452385c49

## Attachment quota setup

Apply the SQL migration in
`supabase/migrations/202606090001_attachment_daily_credits.sql` to the
Supabase project before enabling file uploads.

If the original migration was applied before the timestamp fix, also run
`supabase/migrations/202606090002_fix_attachment_credit_timestamp.sql`.

Set `ATTACHMENT_TOKEN_SECRET` to a long random server-only value. The app
falls back to `OPENROUTER_API_KEY`, but a separate secret is recommended.

Authenticated users receive one new file attachment credit every rolling
24 hours. Follow-up questions about the same signed attachment do not consume
another credit.
