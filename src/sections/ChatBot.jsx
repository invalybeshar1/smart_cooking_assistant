import { useEffect, useRef, useState } from 'react';
import popSound from '../assets/pop.mp3';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! What ingredients do you have today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const audioRef = useRef(null);
  const bottomRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botReply = {
        sender: 'bot',
        text: `Great! Let me find recipes using "${input}"...`
      };
      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
      audioRef.current?.play();
    }, 2000);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <section className="min-h-screen bg-[#FFF9F2] flex items-center justify-center px-4 py-10" id="chatbot">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-4">
        <div className="h-[350px] overflow-y-auto space-y-3 p-2 border border-zinc-100 rounded-lg bg-white">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-4 py-2 rounded-full text-sm ${
                msg.sender === 'user'
                  ? 'ml-auto bg-orange-100 text-right'
                  : 'mr-auto bg-zinc-100'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="mr-auto bg-zinc-100 px-4 py-2 rounded-full text-sm w-fit animate-pulse">
              Typing...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your ingredients..."
            className="flex-grow px-4 py-2 rounded-full border border-zinc-300 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm"
          >
            Send
          </button>
        </div>
      </div>

      <audio ref={audioRef} src={popSound} preload="auto" />
    </section>
  );
}
