import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "./components/ui/button"
import { ModeToggle } from "./components/mode-toggle"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="container mx-auto">
      <ModeToggle></ModeToggle>
      </div>
      
    </ThemeProvider>
  )
}

export default App
