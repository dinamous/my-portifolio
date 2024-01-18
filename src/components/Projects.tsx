import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

import {
  Card
} from "@/components/ui/card"


import { Separator } from "@/components/ui/separator"

import { Terminal, ArrowUpRight } from "lucide-react"


// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitHubLogoIcon } from "@radix-ui/react-icons"

import AutismVogais from "../assets/projects/AutismVogais.png"
import Vizionar from "../assets/projects/Vizionar.png"
import TextToSpeech from "../assets/projects/TextToSpeech.png"
import Jornada from "../assets/projects/Jornada.png"
import Nubank from "../assets/projects/Nubank.png"
import EasyLearn from "../assets/projects/EasyLearn.png"
import Autismalg from "../assets/projects/autismalg.png"

export default function Projects() {

  const projetos = [

    {
      titulo: "EasyLearn",
      img: EasyLearn,
      descricao: "Protipação de uma plataforma web de Ensino à distância, incentivado pela pandemia da COVID-21. Esta aplicação fez uso de inspiração das ferramentas do Google Classroom e Meet.",
      techs: ["Figma", "Undraw", "Adobe Illustrator"],
      repo: false,
      demo: "https://www.figma.com/proto/yoTImyT9jVIU8ndAp5zrZ6/IHC?type=design&node-id=17-2&t=G2PRsKH4Bh2o6pdY-1&scaling=min-zoom&page-id=2%3A2&starting-point-node-id=161%3A3026&mode=design",
      categoria: ["UI/UX"],
    },
    {
      titulo: "Clone Nubank",
      img: Nubank,
      descricao: "Um clone da antiga versão do app do Banco Nubank, em react native. Utilizando o framework Expo e styled componentes, de modo a replicar a interface de forma inteiramente através do CSS",
      techs: ["React Native", "Expo", "styled-components"],
      repo: "https://github.com/dinamous/clone-nubank-expo",
      demo: false,
      categoria: ["Front-End","Mobile"],
    },
    {
      titulo: "TextToSpeech IBM",
      img: TextToSpeech,
      descricao: "Uma aplicação desenvolvida, a fim de  explorar a utilização da I.A do IBM de modo a realizar a conversar do input do usuário em 'text to speech'.",
      techs: ["Node", "SQL", "React", "Sequelize ORM",],
      repo: "https://github.com/dinamous/text-to-speech/tree/master",
      demo: false,
      categoria: ["Front-End","Back-End"],
    },
    {
      titulo: "Vizionar RA (Fictícia)",
      img: Vizionar,
      descricao: "Um website desenvolvido de modo a exemplificar uma landing page de uma empresa ficticia que oferece serviço de Realidade Aumentada.",
      techs: ["HTML", "CSS", "Bootstrap"],
      repo: "https://github.com/dinamous/vizionar",
      demo: "https://dinamous.github.io/vizionar/index.html",
      categoria: ["Front-End"],
    },
    {
      titulo: "AutismVogais",
      img: AutismVogais,
      descricao: "Prototipação de uma Ferramenta digital com o intuito de auxiliar o aprendizado de vogais e alfabetização de crianças no espectro autista.",
      techs: ["Figma", " Adobe Illustrator"],
      repo: false,
      demo: "https://www.figma.com/proto/78kN9WNYqMmahdnCOZ8WNh/AustimVogais?type=design&node-id=1-247&t=UOjnXN9ryUtW62oq-1&scaling=scale-down&page-id=0%3A1&starting-point-node-id=1%3A98&mode=design",
      categoria: ["UI/UX"],
    },

    {
      titulo: "A 13° Jornada Científica e Tecnológica",
      img: Jornada,
      descricao: "Evento científico interdisciplinar de nível nacional com expansão internacional , atuando na área de comunicação científica e tecnológica.",
      techs: ["HTML", "CSS", "Bootstrap"],
      repo: "https://github.com/dinamous/Jornada-Cientifica/",
      demo: "https://dinamous.github.io/Jornada-Cientifica/",
      categoria: ["Front-End"],
    },
    {
      titulo: "AUTISMALG",
      img: Autismalg,
      descricao: "Prototipação de app mobile para Auxiliar no Ensino da Identificação de Algarismos para Crianças com Transtorno do Espectro Autista.",
      techs: ["Figma"],
      repo: "https://github.com/dinamous/Jornada-Cientifica/",
      demo: "https://dinamous.github.io/Jornada-Cientifica/",
      categoria: ["UI/UX"],
    }
  ]

  return (
    <section id="projetos" className="">
      <div className="mx-auto max-w-6xl flex flex-1 items-center flex-col justify-between gap-8 md:px-12">

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

          <Card className="bg-gray-50 dark:bg-slate-900 mx-8 sm:mx-0 sm:w-full" key={index} >
            <div className="flex lg:gap-8 flex-col sm:flex-row p-4 items-center" >

              <div className=" flex items-center justify-center rounded-md w-[50%]  min-w-[65vw] sm:min-w-[40vw] md:min-w-[20vw]">
                <img src={projeto.img} alt="" className="object-contain rounded-lg shadow drop-shadow-sm hover:scale-[1.02] transition-all" />
              </div>
              <div className="flex justify-around flex-col p-6 ">
                <div className="space-y-1">
                  
                  <div className="flex gap-2">
                  {projeto.categoria.map((cat,index)=> (
                    <p className=" text-gray-400 dark:text-slate-00" key={index}> #{cat}</p>
                    ))}
                  </div>

                  <h4 className="text-xl font-medium ">{projeto.titulo}</h4>
                  <p className="text-lg text-muted-foreground">
                    {projeto.descricao}
                  </p>
                </div>


                <Separator className="my-4" />

                <div className="flex justify-between flex-wrap sm:flex-nowrap">

                  <div className="flex my-2  w-full sm:w-fit">
                    {projeto.techs.map((tech, index) => (
                      <p className="p-2 bg-white dark:bg-slate-800 text-center rounded-md m-1 text-xs outline outline-1 outline-gray-200 dark:outline-slate-800" key={index}>{tech}</p>
                    ))}

                  </div>

                  <Separator orientation="vertical" />

                  <div className="flex gap-2 w-full sm:w-fit items-center justify-between">


                    {typeof projeto.repo === 'string' ? (
                      <>
                        <div>
                          <a href={projeto.repo} target="_blank" className="flex gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                            <p>Repo</p>
                            <GitHubLogoIcon height={20} width={20} />
                          </a>
                        </div>

                      </>
                    )

                      : null}

                    {typeof projeto.demo === 'string' ? (

                      <>
                        <div>
                          <a href={projeto.demo} target="_blank" className="flex gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                            <p>Link</p>
                            <ArrowUpRight height={20} width={20} />
                          </a>
                        </div>
                      </>

                    ) : null}
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