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

  return (
    <div style={{ padding: "20px" }}>
      <h1>비밀번호 보안 점검기</h1>

      <input
        type="password"
        placeholder="비밀번호 입력"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <h2>강도 : {getStrength()}</h2>
    </div>
  );
}

export default App;