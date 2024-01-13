import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "./components/Navbar"
import HeroHeader from "./components/HeroHeader"
import AboutMe from "./components/AboutMe"

function App() {
  return (
   <div className="my-8">
     <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Navbar></Navbar>
      <HeroHeader></HeroHeader>
      <AboutMe></AboutMe>
    </ThemeProvider>
   </div>
  )
}

export default App
