import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "./components/Navbar"
import HeroHeader from "./components/HeroHeader"
import AboutMe from "./components/AboutMe"
import Footer from "./components/Footer"
import Contact from "./components/Contact"

function App() {
  return (
   <div className="my-8">
     <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Navbar></Navbar>
      <HeroHeader></HeroHeader>
      <AboutMe></AboutMe>

      <Contact></Contact>
      <Footer></Footer>
    </ThemeProvider>
   </div>
  )
}

export default App
