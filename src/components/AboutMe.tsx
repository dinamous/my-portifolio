
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import Office from "../assets/office.jpg"

export default function AboutMe() {

  return (

    <div className="relative mx-auto  py-32 sm:py-48 lg:py-56 flex flex-1  justify-around  z-auto">
      <Card className="bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle>Sobre mim</CardTitle>
          <CardDescription className="text-lg">Desenvolvedor do interior que vai desbravar o universo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div className="hidden lg:block">
              <img src={Office} alt="office" className="object-fill h-80 w-auto rounded-md " />
            </div>
            <div className="flex justify-around  flex-col">
              <p className="leading-loose max-w-md text-sm lg:text-lg">Como um Programador Front-End Junior, Eu possuo um vasto conhecimento em HTML, CSS, JavaScript, React, Tailwind, and SCSS. Possuo experiência em design de interfaces e na construção de websites responsivos a fim de oferecer uma usabilidade fluida ao usuário.</p>
              <p className="leading-loose max-w-md text-sm lg:text-lg"> Minha expertise está no desenvolvimento sempre voltado ao usuário final, tratando as interfaces com muito cuidade, levando em consideração os paradigmas do UI/UX. E além disso, sempre estou disposto a colaborar em projetos em que possa agregar meus conhecimentos e gerar resultados.</p>
            </div>
          </div>
        </CardContent>
        
      </Card>
    </div>
   

  )
}