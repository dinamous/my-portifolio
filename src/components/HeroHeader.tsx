import { LinkedInLogoIcon, GitHubLogoIcon, } from "@radix-ui/react-icons"
import Avatar from "../assets/avatar-transparente.png"
import AvatarHover from "../assets/avatar-hover.png"
import { useEffect, useState } from "react";
import { toast } from "sonner";

import AOS from 'aos';
import 'aos/dist/aos.css';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function HeroHeader() {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    AOS.init();
  }, [])

  const handleHover = () => {
    setIsHovered(!isHovered);
  };

  const frasesAvatar = [
    "Sinto uma sensação única quando você me toca. É como se fosse mágica.",
    "A cada clique, uma conexão mais profunda é estabelecida.",
    "Suas interações trazem alegria ao meu dia. Obrigado por estar aqui.",
    "Você tem o toque de alguém que entende a verdadeira beleza.",
    "Em cada clique, percebo que a felicidade está nas pequenas coisas.",
    "Você sabe, na vida, assim como nos cliques, é importante encontrar o equilíbrio.",
    "Por trás deste código, há um coração que aprecia cada interação sua.",
    "Ah, você está clicando tão bem que até me faz pensar que estamos em um clique e resposta intergaláctico.",
    "Qual é o programa favorito de um computador? O que começa com CTRL e termina com S!",
    "Por que o computador não tem frio? Porque ele sempre está com Windows!",
  ]

  const getFraseAleatoria = () => {
    return frasesAvatar[Math.floor(Math.random() * frasesAvatar.length)];
  };

  return (
    <section id="inicio" className="min-h-[100vh] isolate px-6 sm:pt-18 lg:px-8">
      
      <div className="mx-auto max-w-6xl py-32 sm:py-48 lg:py-56 flex flex-1  flex-col justify-around md:flex-row md:gap-8 md:flex-row-reverse">
        <div className="flex justify-around flex-col items-center py-4 " data-aos="zoom-in" data-aos-delay="300">

          <TooltipProvider >
            <Tooltip>
              <TooltipTrigger asChild>
                <img src={isHovered ? AvatarHover : Avatar} 
                  onMouseEnter={handleHover}
                  onMouseLeave={handleHover}
                  alt="dinamous avatar"
                  className="w-32 ratio-[1/1] md:w-56  bg-slate-100 dark:bg-slate-900 rounded-full cursor-pointer"
                  onClick={() =>
                    toast("Você cutucou @Dinamous", {
                      description: getFraseAleatoria(),
                    })}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Cutucar 👇</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <p className="font-bold text-shadow shadow-sky-300 "> @dinamous</p>
        </div>

        <div className="text-center md:text-left" data-aos="fade-up" data-aos-duration="500" >
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:pt-16">
            Front-End Dev
          </h1>
          <p className="mt-6 text-lg leading-8 sm:font-semibold">
            Olá, eu sou o Matheus. Um dev apaixonado por Front-End e por UI/UX.<br />
            Pode me encontrar por aí em SP - Brasil.
          </p>
          <div className="mt-10 flex items-center md:justify-start justify-center gap-x-6">

            <a href="https://www.linkedin.com/in/dinamous/" target="_blank" className="px-4 py-3 bg-white dark:bg-slate-900 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <LinkedInLogoIcon height={24} width={24} />
            </a>
            <a href="https://github.com/dinamous" target="_blank" className="px-4 py-3 bg-white dark:bg-slate-900 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <GitHubLogoIcon height={24} width={24} />
            </a>
          </div>
        </div>
      </div>

      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[10vh] left-[10vw] 2xl:left-[20vw] w-[14rem] sm:w-[36rem] aspect-[1/1] bg-[#ff80b5] rounded-full rotate-45"></div>
      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[0vh] left-[10vw] 2xl:left-[20vw] w-[14rem] sm:w-[20rem] aspect-[1/1] bg-[#dbff80] rounded-full animation-delay-4000 rotate-45"></div>
      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[5vh] left-[25vw] 2xl:left-[35vw] w-[10rem] sm:w-[28rem] aspect-[1/1] bg-[#9089fc] rounded-full animation-delay-2000 "></div>
      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[30vh] left-[25vw] 2xl:left-[35vw] w-[15rem] sm:w-[34rem] aspect-[1/1] bg-[#89fcfc] rounded-full animation-delay-4000 rotate-90"></div>

    </section>

  )
}