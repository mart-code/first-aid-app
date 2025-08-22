// app/_layout.js (topmost layout)
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
