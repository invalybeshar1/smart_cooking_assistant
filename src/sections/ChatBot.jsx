import { useEffect, useRef, useState } from 'react';
import popSound from '../assets/chat-pop.mp3';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! What ingredients do you have today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipe, setRecipe] = useState({
    title: '',
    ingredients: [],
    equipment: [],
    servings: '',
    time: {
      prep: '',
      cook: '',
      total: ''
    },
    instructions: [],
    currentStep: 0
  });

  const audioRef = useRef(null);
  const bottomRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Step-by-step control
    if (recipe.instructions.length > 0 && /next|continue|what'?s next/i.test(userMessage.text)) {
      handleNextStep();
      return;
    }

    setIsTyping(true);
    setMessages(prev => [...prev, { sender: 'bot', text: 'Cooking up ideas... 🍳', loading: true }]);

    try {
      const res = await fetch('http://localhost:5001/api/chat/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();

      // Ensure fallback values
      const {
        title = 'Untitled Recipe',
        ingredients = [],
        equipment = [],
        servings = 'N/A',
        time = { prep: 'N/A', cook: 'N/A', total: 'N/A' },
        instructions = []
      } = data;

      setRecipe({
        title,
        ingredients,
        equipment,
        servings,
        time,
        instructions,
        currentStep: 0
      });

      const botMessages = [
        { sender: 'bot', text: `🍽️ Let's cook: ${title}` },
        ingredients.length && { sender: 'bot', text: `🧂 Ingredients:\n${ingredients.join('\n')}` },
        equipment.length && { sender: 'bot', text: `🍳 Equipment:\n${equipment.join('\n')}` },
        { sender: 'bot', text: `⏱️ Time:\nPrep: ${time.prep}\nCook: ${time.cook}\nTotal: ${time.total}` },
        { sender: 'bot', text: `🍽️ Servings: ${servings}` },
        instructions.length
          ? { sender: 'bot', text: `Step 1 of ${instructions.length}\n${instructions[0]}` }
          : { sender: 'bot', text: 'Step 1\nNo instructions provided.' }
      ].filter(Boolean);

      setMessages(prev => [...prev.slice(0, -1), ...botMessages]);
      setIsTyping(false);
      audioRef.current?.play();
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev.slice(0, -1), { sender: 'bot', text: 'Oops! Something went wrong.' }]);
      setIsTyping(false);
    }
  };

  const handleNextStep = () => {
    const next = recipe.currentStep + 1;
    if (next < recipe.instructions.length) {
      const stepMessage = {
        sender: 'bot',
        text: `Step ${next + 1} of ${recipe.instructions.length}\n${recipe.instructions[next]}`
      };
      setRecipe(prev => ({ ...prev, currentStep: next }));
      setMessages(prev => [...prev, stepMessage]);
      audioRef.current?.play();
    } else {
      const doneMessage = {
        sender: 'bot',
        text: `🎉 You've completed all the steps!\n\nWould you like to save this recipe?`
      };
      setMessages(prev => [...prev, doneMessage]);
      setRecipe(prev => ({ ...prev, currentStep: next }));
    }
  };

  const saveRecipe = () => {
    const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    saved.push({
      text: `${recipe.title}\n\nIngredients:\n${recipe.ingredients.join('\n')}\n\nEquipment:\n${recipe.equipment.join(
        '\n'
      )}\n\nServings: ${recipe.servings}\nTime: Prep ${recipe.time.prep}, Cook ${recipe.time.cook}, Total ${recipe.time.total}\n\nInstructions:\n${recipe.instructions.join(
        '\n'
      )}`,
      date: new Date()
    });
    localStorage.setItem('savedRecipes', JSON.stringify(saved));
    alert('Recipe saved to My Recipes!');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <section className="flex justify-center items-center">
      <div className="w-[390px] h-[700px] bg-white dark:bg-zinc-800 rounded-[2rem] shadow-2xl border-4 border-zinc-200 dark:border-zinc-700 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-chatbg dark:bg-darkbg font-cozy">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`relative w-fit max-w-[80%] px-5 py-3 rounded-2xl text-sm shadow-sm animate-fade-in ${
                msg.sender === 'user'
                  ? 'ml-auto bg-[#F4A261] text-white'
                  : 'mr-auto bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white'
              }`}
            >
              <pre className="whitespace-pre-wrap text-sm">{msg.text}</pre>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-1 items-center px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-full w-fit mr-auto">
              <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 bg-zinc-500 dark:bg-zinc-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          )}

          {recipe.instructions.length > 0 && recipe.currentStep === recipe.instructions.length && (
            <div className="text-center mt-4">
              <button onClick={saveRecipe} className="bg-green-600 text-white px-4 py-2 rounded-full text-sm">
                Save Recipe
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your ingredients or say 'next'..."
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

        <audio ref={audioRef} src={popSound} preload="auto" />
      </div>
    </section>
  );
}
