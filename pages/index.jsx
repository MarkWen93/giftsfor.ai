import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function Home() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [historyGifts, setHistoryGifts] = useState([]);

  const questions = [
    { key: "recipient", text: "Who is the gift for? (e.g. friend, coworker, partner)" },
    { key: "occasion", text: "What's the occasion? (e.g. birthday, thank you, anniversary)" },
    { key: "interests", text: "What are their interests or preferences? (e.g. books, wellness, minimalism)" }
  ];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generateGifts();
    }
  };

  const handleChange = (e) => {
    setAnswers({ ...answers, [questions[step].key]: e.target.value });
  };

  const handleGiftClick = (gift) => {
    setSelectedGift(gift);
  };

  const generateGifts = async () => {
    setLoading(true);
    const { recipient = "someone", occasion = "a special day", interests = "something unique" } = answers;
    const prompt = `Suggest 3 thoughtful and creative gift ideas for ${recipient} to celebrate ${occasion}. Their interests include: ${interests}. Respond with a JSON array of objects with 'title' and 'description'.`;
    try {
      const response = await fetch("/api/gift-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: historyGifts.flat().map(g => g.title)
        })
      });
      const data = await response.json();
      setHistoryGifts([...historyGifts, data.gifts]);
      setGifts(data.gifts);
    } catch (error) {
      console.error("Error generating gifts:", error);
      setGifts([
        {
          title: "Something went wrong",
          description: "We couldn't fetch your personalized gifts. Please try again later."
        }
      ]);
    }
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-6xl font-semibold text-gray-800">giftsfor.ai</h1>
        <p className="mt-2 text-lg md:text-2xl text-gray-500">Your intelligent and personalized gift assistant.</p>
      </div>

      {gifts.length === 0 && !loading && (
        <div className="flex flex-col gap-6 w-full max-w-md bg-white p-6 md:p-8 rounded-lg border border-gray-200">
          <label className="text-lg md:text-2xl font-medium text-gray-700 mb-2 block">
            {questions[step].text}
          </label>
          <Input
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800 bg-white text-base md:text-lg"
            value={answers[questions[step].key] || ""}
            onChange={e => setAnswers({ ...answers, [questions[step].key]: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleNext();
            }}
            autoFocus
          />
          <Button
            onClick={handleNext}
            className="w-full mt-4 py-2 px-4 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-base md:text-lg"
            disabled={!answers[questions[step].key]}
          >
            {step < questions.length - 1 ? 'Next' : 'Generate Gift Ideas'}
          </Button>
        </div>
      )}

      {loading && (
        <div className="mt-12 text-gray-500 text-base md:text-lg">Generating gift ideas...</div>
      )}

      {gifts.length > 0 && !loading && (
        <div className="flex flex-col items-center w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl w-full">
            {gifts.map((gift, index) => (
              <Card
                key={index}
                onClick={() => handleGiftClick(gift)}
                className="bg-white border border-gray-200 rounded-lg p-0 shadow-none hover:border-blue-200 transition cursor-pointer"
              >
                <CardContent className="p-4 md:p-5">
                  <h3 className="font-semibold text-lg md:text-xl text-gray-800 mb-1">{gift.title}</h3>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">{gift.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={generateGifts}
              className="py-2 px-6 rounded-md bg-gray-700 text-white font-semibold hover:bg-gray-800 transition text-base md:text-lg"
            >
              Regenerate
            </Button>
            <Button
              onClick={() => {
                setStep(0);
                setAnswers({});
                setGifts([]);
                setLoading(false);
                setHistoryGifts([]);
              }}
              className="py-2 px-6 rounded-md bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition text-base md:text-lg"
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}

      {/* Gift detail modal */}
      {selectedGift && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full border border-gray-200 shadow-lg">
            <h3 className="font-semibold text-xl md:text-2xl text-gray-800 mb-2">{selectedGift.title}</h3>
            <p className="text-gray-600 mb-6 text-base md:text-lg">{selectedGift.description}</p>
            <Button
              onClick={() => setSelectedGift(null)}
              className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-base md:text-lg"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
