import { HeroUIProvider } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import App from "./App";

export default function AppProviders() {
  // bridge navigate → HeroUI (Link dsb. jalan mulus)
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate}>
      <App />
    </HeroUIProvider>
  );
}
