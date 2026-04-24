import { useState, useEffect,useRef } from "react";

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
  if (!text) return;

  // 👉 只在空格后预测（更自然）
  if (!text.endsWith(" ")) return;

  const timer = setTimeout(() => {
    handlesuggest();
  }, 400);

  return () => clearTimeout(timer);
  }, [text]);

  const handleKeyDown = (e) => {
  if (e.key === "Tab" && suggestion) {
    e.preventDefault(); // ❗ 防止跳到下一个输入框

    // 👉 把 suggestion 拼到 text 后面
    setText((prev) => prev + suggestion);

    // 👉 清掉 suggestion
    setSuggestion("");
  }
};

  const handleSummarize = async () => {
    setLoading(true);
    setSummary(""); 

    try {
      console.log("Sending request...");

      const res = await fetch("http://localhost:8000/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      console.log("Response status:", res.status); // ⭐ 看状态

      if (!res.ok) {
        throw new Error("HTTP error " + res.status);
      }

      const data = await res.json();

      console.log("Backend response:", data); // ⭐ 关键！

      setSummary(data.result || "No result returned");

    } catch (error) {
      console.error("Error:", error);
      setSummary("❌ Error: " + error.message);
    }

    setLoading(false);
  };

  const controllerRef = useRef(null);

  const handlesuggest = async () => {
  console.log("Calling suggest API with:", text);

  const context = text.slice(-200);

  try {
    const res = await fetch("http://localhost:8000/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: context }),
    });

    const data = await res.json();
    console.log("Response:", data);

    setSuggestion(data.result || "");

  } catch (error) {
    console.error(error);
  }
  };


  return (
    <div style={{ padding: "20px" }}>
      <h2>Smart Docs</h2>

      {/* 输入框 */}
      <textarea
        placeholder="Type your document here..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value.endsWith(" ")) {
            setSuggestion(""); 
          }
        }}
        onKeyDown={handleKeyDown}
        style={{ width: "100%", height: "200px", marginBottom: "10px" }}

      />

      {/* 按钮 */}
      <button onClick={handleSummarize} disabled={loading}>
        {loading ? "AI is thinking..." : "Summarize"}
      </button>

      {/* loading 提示 */}
      {loading && <p>⏳ Generating summary... (please wait)</p>}

      {/* 输出框 */}
      <textarea
        placeholder="Summary will appear here..."
        value={summary}
        readOnly
        style={{ width: "100%", height: "150px", marginTop: "10px" }}
      />

      {/* 建议输出框 */}
      <textarea
        placeholder="Suggestion will appear here..."
        value={suggestion}
        readOnly
        style={{ width: "100%", height: "150px", marginTop: "10px" }}
      />
    </div>
  );
}

export default App;