import { useEffect } from "react";
import { initSectionStack } from "./lib/sectionStack";
import { isNotFoundPath } from "./lib/router";
import SectionNav from "./components/SectionNav/SectionNav";
import Hero from "./views/Hero/Hero";
import WhatIDo from "./views/WhatIDo/WhatIDo";
import AboutMe from "./views/AboutMe/AboutMe";
import Projects from "./views/Projects/Projects";
import Skills from "./views/Skills/Skills";
import Contact from "./views/Contact/Contact";
import ProjectDetail from "./views/ProjectDetail/ProjectDetail";
import NotFound from "./views/NotFound/NotFound";

export default function App() {
  // a rota só muda via pushState entre home e projeto válido, então decidir uma
  // vez no mount basta — o link de volta do 404 é navegação real
  const notFound = isNotFoundPath();

  useEffect(() => {
    if (!notFound) initSectionStack();
  }, [notFound]);

  if (notFound) return <NotFound />;

  return (
    <>
      <Hero />
      <WhatIDo />
      <AboutMe />
      <Projects />
      <Skills />
      <Contact />
      <SectionNav />
      <ProjectDetail />
    </>
  );
}
