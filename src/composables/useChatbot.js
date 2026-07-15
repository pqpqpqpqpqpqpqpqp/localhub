import { ref } from 'vue';

const messages = ref([]);

async function sendMessage(userContent, options = {}) {
  const { context = [] } = options;

  messages.value.push({ role: 'user', content: userContent });

  const systemMessages = context.map((c) => ({ role: 'system', content: c }));

  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [...systemMessages, ...messages.value.map((m) => ({ role: m.role, content: m.content }))],
    temperature: 0.7,
  };

  const key = import.meta.env.VITE_OPENAI_KEY;
  if (!key) {
    throw new Error('VITE_OPENAI_KEY is not set. Add it to your .env (client exposure warning).');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  const data = await res.json();
  const assistant = data.choices && data.choices[0] && data.choices[0].message;
  if (assistant) {
    messages.value.push(assistant);
  }

  return assistant;
}

export function useChatbot() {
  return { messages, sendMessage };
}
