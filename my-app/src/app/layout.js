import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata = {
  title: "BookConnect",
  description: "A social network for book readers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}