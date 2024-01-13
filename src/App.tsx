import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "./components/Navbar"
import HeroHeader from "./components/HeroHeader"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Navbar></Navbar>
      
      
    </ThemeProvider>
  )
}

export default App
