import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";

export default function Footer() {

  return (
    <div className="relative py-16 z-auto dark:bg-slate-800 bg-gray-100">
      <div className="mx-auto max-w-4xl flex flex-1 items-center flex-col justify-between md:flex-row gap-8 md:px-12">
        <p className="text-sm font-bold  dark:text-white">Copyright © 2024. All rights are reserved</p>
        <div className="flex gap-10">
          <a href="https://www.linkedin.com/in/dinamous/" target="_blank" className="px-4 py-3 bg-white dark:bg-slate-900 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <LinkedInLogoIcon height={20} width={20} />
          </a>
          <a href="https://github.com/dinamous" target="_blank" className="px-4 py-3 bg-white dark:bg-slate-900 rounded-lg shadow drop-shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <GitHubLogoIcon height={20} width={20} />
          </a>
        </div>
      </div>
    </div>


  )
}