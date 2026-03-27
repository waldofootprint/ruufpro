// Minimal layout for the embedded widget — no nav, no footer.
// Just loads global CSS and renders the widget.

import "../../globals.css";

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-transparent">{children}</body>
    </html>
  );
}
