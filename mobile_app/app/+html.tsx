import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this file are injected into the HTML document
// as the children of the `<html>` element.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        {/* Force base path to be root, not dashboard */}
        <base href="/" />
      </head>
      <body>{children}</body>
    </html>
  );
} 