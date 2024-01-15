import { LinkedInLogoIcon, GitHubLogoIcon, } from "@radix-ui/react-icons"
import Avatar from "../assets/avatar-transparente.png"
import AvatarHover from "../assets/avatar-hover.png"
import { useState } from "react";

export default function HeroHeader() {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = () => {
    setIsHovered(!isHovered);
  };

  return (
    <div className="isolate px-6 sm:pt-32 lg:px-8">
      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[10vh] left-[5vw]  w-[14rem] sm:w-[36rem] aspect-[1/1] bg-[#ff80b5] rounded-full rotate-45"></div>
      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[0vh] left-[10vw]  w-[14rem] sm:w-[20rem] aspect-[1/1] bg-[#dbff80] rounded-full animation-delay-4000 rotate-45"></div>
      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[5vh] left-[25vw]  w-[10rem] sm:w-[28rem] aspect-[1/1] bg-[#9089fc] rounded-full animation-delay-2000 "></div>
      <div className="absolute -z-10 inset-x-0 overflow-hidden animate-blob  mix-blend-multiply filter blur-3xl opacity-70 top-[30vh] left-[25vw]  w-[15rem] sm:w-[34rem] aspect-[1/1] bg-[#89fcfc] rounded-full animation-delay-4000 rotate-90"></div>
          
      <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56 flex flex-1  flex-col justify-around md:flex-row md:gap-8">
        <div className="flex justify-around flex-col items-center py-4 ">
          <img src={ isHovered ? AvatarHover : Avatar }
              onMouseEnter={handleHover}
              onMouseLeave={handleHover}
              alt="dinamous avatar"
              className="w-28 h-28 md:w-44 md:h-44 bg-white dark:bg-slate-900 rounded-full" />
          <p className="font-bold text-shadow shadow-sky-300 "> @dinamous</p>
        </div>

        <div className="text-center md:text-left ">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Front-End Dev
          </h1>
          <p className="mt-6 text-lg leading-8 ">
            Olá, eu sou o Matheus. Um dev apaixonado por Front-End e por UI/UX.<br />
            Pode me encontrar por aí em SP - Brasil.
          </p>
          <div className="mt-10 flex items-center md:justify-start justify-center gap-x-6">
            
              <a href="https://www.linkedin.com/in/dinamous/" target="_blank" className="px-4 py-3 bg-white dark:bg-slate-900 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <LinkedInLogoIcon height={24} width={24}/>
              </a>
              <a href="https://github.com/dinamous" target="_blank" className="px-4 py-3 bg-white dark:bg-slate-900 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                <GitHubLogoIcon height={24} width={24}/>
              </a>
          </div>
        </div>
      </div>
    </div>

  )
}