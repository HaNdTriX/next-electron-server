import OmniBox from "../components/OmniBox";
import Navigation from "../components/Navigation";

export default function NotFoundPage({ Component, pageProps }) {
  return (
    <>
      <h1>404 NotFound</h1>
      <p>This is a custom 404 not found page!</p>
      <OmniBox />
      <Navigation />
    </>
  );
}
