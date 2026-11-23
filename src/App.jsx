import { useState } from "react";

function App() {
  const [password, setPassword] = useState("");

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

    const array = new Uint32Array(12);
    crypto.getRandomValues(array);

    let result = "";

    for (let i = 0; i < array.length; i++) {
      result += chars[array[i] % chars.length];
    }

    setPassword(result);
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
    </div>
  );
}

export default App;