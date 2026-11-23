import { useState } from "react";

function App() {
  const [password, setPassword] = useState("");
  const [breachResult, setBreachResult] = useState("");

  const getStrength = () => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return "약함";
    if (score <= 4) return "보통";
    return "강함";
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

    const randomValues = new Uint32Array(12);
    crypto.getRandomValues(randomValues);

    let result = "";

    for (let i = 0; i < randomValues.length; i++) {
      result += chars[randomValues[i] % chars.length];
    }

    setPassword(result);
  };

  const sha1 = async (text) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const hashBuffer = await crypto.subtle.digest("SHA-1", data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  };

  const checkBreach = async () => {
    if (!password) return;

    const hash = await sha1(password);

    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );

    const data = await response.text();

    const lines = data.split("\n");

    const found = lines.find((line) =>
      line.startsWith(suffix)
    );

    if (found) {
      const count = found.split(":")[1];
      setBreachResult(`유출됨 (${count.trim()}회)`);
    } else {
      setBreachResult("유출 기록 없음");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>비밀번호 보안 점검기</h1>

      <input
        type="password"
        value={password}
        placeholder="비밀번호 입력"
        onChange={(e) => setPassword(e.target.value)}
      />

      <p>강도: {getStrength()}</p>

      <button onClick={generatePassword}>
        안전한 비밀번호 생성
      </button>

      <button
        onClick={checkBreach}
        style={{ marginLeft: "10px" }}
      >
        유출 확인
      </button>

      <p>{breachResult}</p>
    </div>
  );
}

export default App;
