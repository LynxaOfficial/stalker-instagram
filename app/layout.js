export const metadata = {
  title: "IGSTALK — Public Profile Intelligence",
  description: "Clean dashboard for public Instagram profile data.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#fafafa", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
