import { useEffect, useRef, useState } from 'react';
import popSound from '../assets/chat-pop.mp3';

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/#+\s+(.*)/g, '$1');
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! What ingredients do you have today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fullRecipe, setFullRecipe] = useState('');
  const audioRef = useRef(null);
  const bottomRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setMessages(prev => [...prev, { sender: 'bot', text: 'Cooking up ideas... 🍳', loading: true }]);

    try {
      const res = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Give me one recipe name and its main ingredients only using: ${input}`
        })
      });

      const data = await res.json();
      const reply = data.reply;

      const match = reply.match(/\*\*(.*?)\*\*.*?(?:ingredients:|Ingredients:)?\s*([\s\S]*?)(?:\n|$)/i);
      const recipeName = match?.[1]?.trim() || 'Recipe';
      const ingredients = match?.[2]?.trim().replace(/\n/g, ', ') || 'Ingredients not found';

      const replyMessage = {
        sender: 'bot',
        text: `**${recipeName}**\nMain ingredients: ${ingredients}`,
        fullText: reply,
        showButton: true
      };

      setMessages(prev => [...prev.slice(0, -1), replyMessage]);
      setIsTyping(false);
      audioRef.current?.play();
    } catch (err) {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'bot', text: 'Oops! Something went wrong.' }]);
      setIsTyping(false);
    }
  };

  const handleStartCooking = (recipeText) => {
    setFullRecipe(recipeText);
    audioRef.current?.play();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, fullRecipe]);

  return (
    <section className="flex justify-center items-center">
      <div className="w-[390px] h-[700px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-2xl border-4 border-zinc-200 dark:border-zinc-700 flex flex-col overflow-hidden">

        {/* Chat area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-chatbg dark:bg-darkbg font-cozy">
          {messages.map((msg, i) => (
            <div key={i} className={`relative w-fit max-w-[80%] px-5 py-3 rounded-2xl text-sm shadow-sm animate-fade-in ${msg.sender === 'user'
              ? "ml-auto bg-[#F4A261] text-white rounded-br-none before:content-[''] before:absolute before:-bottom-1 before:right-0 before:border-[8px] before:border-transparent before:border-t-[#F4A261] before:translate-x-1"
              : "mr-auto bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-bl-none before:content-[''] before:absolute before:-bottom-1 before:left-0 before:border-[8px] before:border-transparent before:border-t-zinc-200 dark:before:border-t-zinc-700 before:-translate-x-1"
            }`}>
              <pre className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-white">
                {stripMarkdown(msg.text)}
              </pre>
              {msg.showButton && (
                <button
                  onClick={() => handleStartCooking(msg.fullText)}
                  className="mt-2 bg-primary hover:bg-highlight text-white px-3 py-1 rounded-full text-xs"
                >
                  Start Cooking
                </button>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-1 items-center px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-full w-fit mr-auto">
              <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          )}

          {/* Recipe card output */}
          {fullRecipe && (
            <div className="bg-white dark:bg-zinc-700 p-4 mt-4 rounded-xl border dark:border-zinc-600 shadow text-sm text-zinc-900 dark:text-white">
              <h3 className="font-semibold text-lg mb-2">🍽️ Full Recipe</h3>
              <pre className="whitespace-pre-wrap">{stripMarkdown(fullRecipe)}</pre>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your ingredients..."
              className="flex-grow px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="bg-primary hover:bg-highlight text-white px-4 py-2 rounded-full text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={popSound} preload="auto" />
    </section>
  );
}
