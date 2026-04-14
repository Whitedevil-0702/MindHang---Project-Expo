export const CONFIG = {
  groqEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
  groqModel: 'llama-3.1-8b-instant',
  groqApiKey: import.meta.env.VITE_GROQ_API_KEY_ARIA || '', // Loaded from backend .env file
  
  weightIncrement: 1.5,
  weightDecrement: 0.8,
  weightMax: 5.0,
  weightMin: 0.5,
  
  bluffRates: {
    easy: 0.08,
    medium: 0.28,
    hard: 0.45
  },
  
  scoring: {
    correctGuess: 10,
    wrongGuess: -5,
    winBonus: 20,
    wrongBluffCall: -15,
    hintEarly: -20,
    hintLate: -5
  }
};
