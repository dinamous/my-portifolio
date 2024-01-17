
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

    <section id="sobre">
      <div  className="mx-auto max-w-6xl flex flex-1 items-center flex-col justify-between md:flex-row gap-8 md:px-12">
      <Card className="bg-gray-50 dark:bg-slate-900 mx-8 sm:mx-0 sm:w-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold tracking-tight sm:text-2xl w-[40%] ">Sobre mim</CardTitle>
          <CardDescription className="text-lg">Desenvolvedor do interior que vai desbravar o universo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex lg:gap-8">
            <div className="hidden lg:block w-2/6">
              <img src={Office} alt="office" className="object-cover h-80 w-full rounded-md " />
            </div>
            <div className="flex justify-around flex-col w-4/6">
              <p className="leading-loose  text-sm lg:text-lg">Como um Programador Front-End Junior, Eu possuo um vasto conhecimento em HTML, CSS, JavaScript, React, Tailwind, and SCSS. Possuo experiência em design de interfaces e na construção de websites responsivos a fim de oferecer uma usabilidade fluida ao usuário.</p>
              <p className="leading-loose  text-sm lg:text-lg"> Minha expertise está no desenvolvimento sempre voltado ao usuário final, tratando as interfaces com muito cuidade, levando em consideração os paradigmas do UI/UX. E além disso, sempre estou disposto a colaborar em projetos em que possa agregar meus conhecimentos e gerar resultados.</p>
            </div>
          </div>
        </CardContent>
        
      </Card>
      </div>
      
    </section>
   

  )
}