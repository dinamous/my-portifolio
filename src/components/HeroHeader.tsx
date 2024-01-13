import { LinkedInLogoIcon, GitHubLogoIcon, } from "@radix-ui/react-icons"
import Avatar from "../assets/Cute Avatar.png"
import { Button } from "./ui/button"

export default function HeroHeader() {

  return (

    <div className="relative isolate px-6 pt-32 lg:px-8">

      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="animate-blob-top relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr dark:from-[#f292ff] dark:to-[#89fcfc] from-[#8084ff] to-[#0ce74a] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"

        />
      </div>
      <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56 flex flex-1  flex-col justify-around md:flex-row md:gap-8">
        <div className="flex justify-around flex-col items-center ">
          <img src={Avatar} alt="dinamous avatar" className="w-28 h-28 md:w-44 md:h-44" />
          <p className="font-bold text-shadow shadow-emerald-300"> @dinamous</p>
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
            <Button variant={"secondary"} >

              <a href="https://www.linkedin.com/in/dinamous/" target="_blank">
                <LinkedInLogoIcon />
              </a>
            </Button>
            <Button variant={"secondary"}>
              <a href="https://github.com/dinamous" target="_blank"><GitHubLogoIcon /></a>
            </Button>
          </div>
        </div>
      </div>


      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="animate-blob-bottom relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#b780ff] to-[#0ce74a] dark:from-[#ff80b5] dark:to-[#9089fc] dark:opacity-30 opacity-60 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"

        />
      </div>
    </div>

  )
}