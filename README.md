# BrainBot

BrainBot is a full-stack AI chat application built to explore how modern AI-powered chat products work end to end. It focuses on real-time streamed responses, persistent conversations, authentication, file handling, responsive UI, and cost-aware API usage.

Live demo:
https://basmakuhail-brain-bot.vercel.app


## Overview

BrainBot allows users to create and manage AI conversations through a responsive web interface. Users can sign in, send messages, attach files or images, manage their chat history, and export conversations in different formats.

The project was built as an experimental application for learning and testing full-stack AI application development.

## Features

* Real-time streamed AI responses
* User authentication
* User profile management
* Persistent chat history
* Create, search, rename, delete, and regenerate conversations
* File and image attachments
* Export chats as PDF, Markdown, or plain text
* Light and dark themes
* Responsive mobile and desktop layout
* Secure data persistence using Supabase
* API usage limits to reduce credit consumption

## Tech Stack

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Supabase**
* **OpenRouter**
* **OpenAI SDK**

## Usage Limits

BrainBot is an experimental web app, so some restrictions were added to control API credit usage.

Current limitations:

* Only the previous 10 messages are sent to the AI API as conversation context.

  * This includes 5 user prompts and 5 AI responses.
  * Very long conversations may not always retain full continuity.
* Users can share 1 file or image attachment per day.

These limits were added intentionally to keep the project practical for testing without consuming excessive API credits.

## Main Functionality

### AI Chat

Users can send messages and receive streamed AI responses in real time. The streaming behaviour improves the user experience by displaying responses progressively instead of waiting for the full answer to complete.

### Authentication

BrainBot includes user authentication and profile management using Supabase. Authenticated users can access their saved conversations and manage their chat history.

### Persistent Conversations

Chat conversations are stored securely using Supabase, allowing users to return to previous conversations later.

Users can:

* View previous conversations
* Search conversations
* Rename conversations
* Delete conversations
* Regenerate AI responses

### Attachments

BrainBot supports file and image attachments. Attachments are limited to one per day to reduce storage and API usage costs.

### Export Options

Users can export conversations in multiple formats:

* PDF
* Markdown
* Plain text

### Theme Support

BrainBot supports both light and dark themes, allowing users to choose their preferred interface style.

## What I Learned

This project helped me strengthen my experience with:

* AI API integration
* Streaming responses
* Authentication flows
* Supabase database integration
* File and image processing
* Persistent state management
* Responsive UI development
* Cost-aware API design
* Full-stack application structure


## Getting Started

### Prerequisites

You need the following installed:

* Node.js
* npm, yarn, pnpm, or bun
* Supabase project
* OpenRouter API key
* OpenAI-compatible SDK configuration

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd brainbot
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env.local
```

Add the required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
```

Run the development server:

```bash
npm run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

## Deployment

The project is deployed on Vercel.
Visit: https://basmakuhail-brain-bot.vercel.app

