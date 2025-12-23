// API Configuration
// You can also set these in .env file with VITE_ prefix

export const config = {
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ,
  model: import.meta.env.VITE_MODEL || "claude-sonnet-4-20250514",
  // Use 'openai' or 'anthropic'
  provider: import.meta.env.VITE_PROVIDER || "anthropic",
};

