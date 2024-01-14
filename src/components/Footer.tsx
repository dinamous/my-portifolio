import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

export default function Footer() {

  return (
    <div className="relative py-16 z-auto dark:bg-slate-700 bg-gray-300">
       <div className="mx-auto max-w-4xl flex flex-1 items-center flex-col justify-between md:flex-row gap-8 md:px-12">
        <p className="text-sm font-bold  dark:text-white">Copyright © 2024. All rights are reserved</p>
        <div className="flex gap-10">
            <Button variant={"secondary"} >
              <a href="https://www.linkedin.com/in/dinamous/" target="_blank">
                <LinkedInLogoIcon />
              </a>
            </Button>
            <Button variant={"secondary"}>
              <a href="https://github.com/dinamous" target="_blank">
                <GitHubLogoIcon />
              </a>
            </Button>
        </div>
      </div>
    </div>
   

  )
}