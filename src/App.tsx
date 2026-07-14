import { useEffect } from "react";
import { initSectionStack } from "./lib/sectionStack";
import Hero from "./components/Hero";
import WhatIDo from "./components/WhatIDo";
import AboutMe from "./components/AboutMe";
import Projects from "./components/Projects";
import Skills from "./components/Skills";
import Contact from "./components/Contact";

export default function App() {
  useEffect(() => {
    initSectionStack();
  }, []);

  return (
    <>
      <Hero />
      <WhatIDo />
      <AboutMe />
      <Projects />
      <Skills />
      <Contact />
    </>
  );
}
