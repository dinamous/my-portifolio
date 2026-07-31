import { useEffect } from "react";
import { initSectionStack } from "./lib/sectionStack";
import SectionNav from "./components/SectionNav/SectionNav";
import Hero from "./views/Hero/Hero";
import WhatIDo from "./views/WhatIDo/WhatIDo";
import AboutMe from "./views/AboutMe/AboutMe";
import Projects from "./views/Projects/Projects";
import Skills from "./views/Skills/Skills";
import Contact from "./views/Contact/Contact";

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
      <SectionNav />
    </>
  );
}
