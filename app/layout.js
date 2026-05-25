import './globals.css';

export const metadata = {
  title: 'FortiGRC - Enterprise Risk Management',
  description: 'FortiGRC Enterprise Risk Management — Quantitative risk analysis, compliance tracking, and governance aligned with Zero Trust principles.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
