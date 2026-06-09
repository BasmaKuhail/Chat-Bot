import { Head, Html, Main, NextScript } from "next/document";

const themeScript = `
  try {
    var savedTheme = localStorage.getItem("brainbot-theme");
    document.documentElement.dataset.theme =
      savedTheme === "light" ? "light" : "dark";
  } catch (_) {
    document.documentElement.dataset.theme = "dark";
  }
`;

export default function Document() {
  return (
    <Html lang="en" data-theme="dark">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
