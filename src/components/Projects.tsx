import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import {
  Card
} from "@/components/ui/card"
import Jornada from "../assets/projects/jornada.png"

import { Separator } from "@/components/ui/separator"

import { Terminal, ArrowUpRight } from "lucide-react"


// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitHubLogoIcon } from "@radix-ui/react-icons"


export default function Projects() {

  const projetos = [
    {
      titulo: "A 13° Jornada Científica e Técnológica",
      img: Jornada,
      descricao: "Evento científico interdisciplinar de nível nacional com expansão internacional , atuando na área de comunicação científica e tecnológica.",
      techs: "HTML , CSS , Bootstrap",
      repo: "https://github.com/dinamous/Jornada-Cientifica",
      demo: "https://dinamous.github.io/Jornada-Cientifica/",
      categoria: "Front-End",
    }
  ]

  return (
    <section id="projetos" className="">
      <div className="mx-auto max-w-4xl flex flex-1 items-center flex-col justify-between gap-8 md:px-12">

        <Alert className="bg-gray-50 dark:bg-slate-900 mx-8">
          <Terminal className="h-5 w-5 mt-2" />
          <AlertTitle className="text-lg font-bold tracking-tight sm:text-2xl w-[50%]">Meus Projetos</AlertTitle>
          <AlertDescription>
            Uma pequena coleção dos meus melhores trabalhos.
          </AlertDescription>
        </Alert>

        {/* <Tabs defaultValue="Front" className="">
          <TabsList className="min-w-[20vw] bg-gray-50 dark:bg-slate-900">
            <TabsTrigger value="Front">Front-End</TabsTrigger>
            <TabsTrigger value="UI/UX">UI/UX</TabsTrigger>
            <TabsTrigger value="3d">3D</TabsTrigger>
          </TabsList>
          <TabsContent value="Front">

          </TabsContent>
          <TabsContent value="UI/UX">Change your password here.</TabsContent>
          <TabsContent value="3d">Change your password here.</TabsContent>
        </Tabs> */}

        {projetos.map((projeto, index) => (

          <Card className="bg-gray-50 dark:bg-slate-900 mx-8 sm:mx-0 sm:w-full" key={index}>
            <div className="flex lg:gap-8 flex-col sm:flex-row p-4">

              <div className=" flex items-center justify-center rounded-md max-w-[40%]">
                <img src={projeto.img} alt="" className="object-contain rounded-lg " />
              </div>
              <div className="flex justify-around flex-col p-6 ">
                <div className="space-y-1">
                  <h4 className="text-lg font-medium ">{projeto.titulo}</h4>
                  <p className="text-md text-muted-foreground">
                   {projeto.descricao}
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="flex h-5 items-center space-x-4 text-sm">

                  <div>{projeto.techs}</div>
                  <Separator orientation="vertical" />
                  <div>
                    <a href={projeto.repo} target="_blank" className="flex gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                      <p>Repo</p>
                      <GitHubLogoIcon height={20} width={20} />
                    </a>
                  </div>
                  <Separator orientation="vertical" />
                  <div>
                    <a href={projeto.demo} target="_blank" className="flex gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                      <p>Link</p>
                      <ArrowUpRight height={20} width={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>


          </Card>
        ))}


      </div>
    </section>


  )
}