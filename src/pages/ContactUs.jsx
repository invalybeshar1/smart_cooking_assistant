import { useState } from 'react';

const faqs = [
  {
    question: 'Why didn’t I get recipe suggestions?',
    answer: 'Make sure you have entered your dietary preferences and available ingredients in your profile settings.'
  },
  {
    question: 'How do I reset my chatbot?',
    answer: 'Go to your profile and click the “Reset Chatbot History” button.'
  },
  {
    question: 'How do I cancel Premium?',
    answer: 'In the My Profile page, under Subscription section, click on “Manage Subscription” and select Cancel.'
  },
  {
    question: 'Can I customize ingredient substitutions?',
    answer: 'Yes, Premium users can fully customize substitutions based on their preferences or intolerances.'
  }
];

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-4 mb-10">
        <h3 className="text-lg font-semibold mb-2">Leave us a message</h3>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your Name"
          required
          className="w-full px-4 py-2 border rounded-md"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Your Email"
          required
          className="w-full px-4 py-2 border rounded-md"
        />
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Subject"
          className="w-full px-4 py-2 border rounded-md"
        />
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Your Message"
          required
          rows={4}
          className="w-full px-4 py-2 border rounded-md"
        />
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-sm"
        >
          Submit
        </button>
        {submitted && (
          <p className="text-green-600 text-sm mt-2">Thank you! We'll get back to you within 24 hours.</p>
        )}
      </form>

      {/* FAQs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-2">
              <button
                className="w-full text-left font-medium text-zinc-800 flex justify-between items-center"
                onClick={() => setExpanded(expanded === index ? null : index)}
              >
                {faq.question}
                <span>{expanded === index ? '-' : '+'}</span>
              </button>
              {expanded === index && (
                <p className="text-sm text-zinc-600 mt-2">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
