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
import Jornada from "../assets/projects/IFSUL.png"
import Nubank from "../assets/projects/Nubank.png"
import EasyLearn from "../assets/projects/EasyLearn.png"
import Autismalg from "../assets/projects/autismalg.png"
import Pizzashop from "../assets/projects/pizzashop.png"


export default function Projects() {

  const projetos = [
    {
      titulo: "pizza.shop",
      img: Pizzashop ,
      descricao: "Uma aplicação simulando um dashbaord de vendas, inspirado na plataforma Ifood. ",
      techs: ["Vue", "Vite", "Vuelidate","shadcn/ui"],
      repo: false,
      demo: "",
      categoria: ["Front-end"],
      actions: [
        {
          label: "Repo",
          link: "https://github.com/dinamous/pizza-shop/tree/main"
        },
        {
          label: "Link",
          link: "https://pizza-shop-web.vercel.app"
        }
      ]
    },
    {
      titulo: "AutismVogais",
      img: AutismVogais,
      descricao: "Prototipação de uma Ferramenta digital com o intuito de auxiliar o aprendizado de vogais e alfabetização de crianças no espectro autista.",
      techs: ["Figma", " Adobe Illustrator"],
      repo: false,
      demo: "",
      categoria: ["UI/UX"],
      actions: [
        {
          label: "Link",
          link: "https://www.figma.com/proto/78kN9WNYqMmahdnCOZ8WNh/AustimVogais?type=design&node-id=1-247&t=UOjnXN9ryUtW62oq-1&scaling=scale-down&page-id=0%3A1&starting-point-node-id=1%3A98&mode=design"
        }
      ]
    },
    {
      titulo: "EasyLearn",
      img: EasyLearn,
      descricao: "Protipação de uma plataforma web de Ensino à distância, incentivado pela pandemia da COVID-21. Esta aplicação fez uso de inspiração das ferramentas do Google Classroom e Meet.",
      techs: ["Figma", "Undraw", "Adobe Illustrator"],
      repo: false,
      categoria: ["UI/UX"],
      actions: [
        {
          label: "Link",
          link: "https://www.figma.com/proto/yoTImyT9jVIU8ndAp5zrZ6/IHC?type=design&node-id=17-2&t=G2PRsKH4Bh2o6pdY-1&scaling=min-zoom&page-id=2%3A2&starting-point-node-id=161%3A3026&mode=design"
        }
      ]
    },
    {
      titulo: "Clone Nubank",
      img: Nubank,
      descricao: "Um clone da antiga versão do app do Banco Nubank, em react native. Utilizando o framework Expo e styled componentes, de modo a replicar a interface de forma inteiramente através do CSS",
      techs: ["React Native", "Expo", "styled-components"],

      demo: false,
      categoria: ["Front-End", "Mobile"],
      actions: [
        {
          label: "Repo",
          link: "https://github.com/dinamous/clone-nubank-expo"
        }
      ]
    },
    {
      titulo: "TextToSpeech IBM",
      img: TextToSpeech,
      descricao: "Uma aplicação desenvolvida, a fim de  explorar a utilização da I.A do IBM de modo a realizar a conversar do input do usuário em 'text to speech'.",
      techs: ["Node", "SQL", "React", "Sequelize ORM",],

      demo: false,
      categoria: ["Front-End", "Back-End"],
      actions: [
        {
          label: "Repo",
          link: "https://github.com/dinamous/text-to-speech/tree/master"
        }
      ]
    },
    {
      titulo: "Vizionar RA (Fictícia)",
      img: Vizionar,
      descricao: "Um website desenvolvido de modo a exemplificar uma landing page de uma empresa ficticia que oferece serviço de Realidade Aumentada.",
      techs: ["HTML", "CSS", "Bootstrap"],
      categoria: ["Front-End"],
      actions: [
        {
          label: "Repo",
          link: "https://github.com/dinamous/vizionar"
        },
        {
          label: "Link",
          link: "https://dinamous.github.io/vizionar/index.html"
        }
      ]
    },


    {
      titulo: "A 13° Jornada Científica e Tecnológica",
      img: Jornada,
      descricao: "Evento científico interdisciplinar de nível nacional com expansão internacional , atuando na área de comunicação científica e tecnológica.",
      techs: ["HTML", "CSS", "Bootstrap"],
      categoria: ["Front-End"],
      actions: [
        {
          label: "Repo",
          link: "https://github.com/dinamous/Jornada-Cientifica/"
        },
        {
          label: "Link",
          link: "https://dinamous.github.io/Jornada-Cientifica/"
        }
      ]
    },
    {
      titulo: "AUTISMALG",
      img: Autismalg,
      descricao: "Prototipação de app mobile para Auxiliar no Ensino da Identificação de Algarismos para Crianças com Transtorno do Espectro Autista.",
      techs: ["Figma"],
      categoria: ["UI/UX"],
      actions: [
        {
          label: "Link",
          link: "https://www.figma.com/proto/dTrNLKDrc3lsftnkA1BOcS/F%C3%A1bio---ALTISMALG?type=design&node-id=381-329&t=HYcQdxBtTDPHzeRU-1&scaling=scale-down&page-id=369%3A122&starting-point-node-id=381%3A225&mode=design"
        }
      ]
    }
  ]

  return (
    <section id="projetos" className="">
      <div className="mx-auto max-w-6xl flex flex-1 items-center flex-col justify-between gap-8 md:px-12">

        <div className="w-full" data-aos="fade-up">
          <Alert className="bg-gray-50 dark:bg-slate-900">
            <Terminal className="h-5 w-5 mt-2" />
            <AlertTitle className="text-lg font-bold tracking-tight sm:text-2xl w-[50%]">Meus Projetos</AlertTitle>
            <AlertDescription>
              Uma pequena coleção dos meus melhores trabalhos.
            </AlertDescription>
          </Alert>
        </div>
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

          <div data-aos="fade-up-right" key={index}>
            <Card className="bg-gray-50 dark:bg-slate-900 mx-8 sm:mx-0 sm:w-full "  >
              <div className="flex flex-col sm:flex-row" >
                {/* flex items-center justify-center rounded-md sm:min-w-[40vw] md:min-w-[20vw] w-[1/3] */}
                {/* rounded-lg shadow drop-shadow-sm hover:scale-[1.02] transition-all */}
                <div className="w-full sm:w-2/5 flex items-center justify-center p-4 ">
                  <img src={projeto.img} alt="" className="w-full h-auto rounded-lg hover:scale-[1.02] transition-all" />
                </div>

                <div className="w-full sm:w-3/5 flex justify-around flex-col p-6">
                  <div className="space-y-1">

                    <div className="flex gap-2">
                      {projeto.categoria.map((cat, index) => (
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


                      {projeto.actions.map((action, index) => (


                        <a key={index} href={action.link} target="_blank" className="flex gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                          <p>{action.label}</p>
                          {
                            action.label === "Repo" ?
                              <GitHubLogoIcon height={20} width={20} /> :
                              <ArrowUpRight height={20} width={20} />

                          }

                        </a>

                      ))

                      }
                    </div>
                  </div>
                </div>
              </div>


            </Card>
          </div>
        ))}


      </div>
    </section>


  )
}