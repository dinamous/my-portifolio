import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "./components/Navbar"
import HeroHeader from "./components/HeroHeader"
import AboutMe from "./components/AboutMe"
import Footer from "./components/Footer"
import Contact from "./components/Contact"
import MyStack from "./components/MyStack"
import { Toaster } from "./components/ui/sonner"
import Projects from "./components/Projects"

function App() {
  return (
    <div>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Navbar></Navbar>
        <div className="flex flex-col justify-between gap-40">
          <HeroHeader></HeroHeader>
          <MyStack></MyStack>
          <AboutMe></AboutMe>
          <Projects></Projects>
          <Contact></Contact>
        </div>

        <Footer></Footer>
        <Toaster />

      </ThemeProvider>
    </div>
  )
}

export default App
