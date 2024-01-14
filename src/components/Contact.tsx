import { HomeIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons"
export default function Contact() {

  return (
    <div className="py-16 z-auto dark:bg-slate-900 bg-gray-200">
      <div className="mx-auto max-w-4xl flex md:items-start items-center flex-col justify-around gap-2 md:px-12 ">
        <h1 className="lg:text-2xl font-semibold leading-none tracking-tight text-lg">Contato</h1>
        <p className="lg:text-lg text-muted-foreground text-xs text-black dark:text-white">Você pode me encontrar por aqui 👇</p>
      </div>
        
      <div className="mx-auto max-w-4xl flex items-center flex-col md:flex-row justify-between gap-4 md:px-12 mt-8">   
        <div className="flex items-center justify-around gap-4 p-4 outline-1 outline-double rounded-md outline-gray-300 dark:outline-none dark:bg-slate-800 bg-slate-200">
            <div className="flex items-center justify-center rounded-full ">
              <HomeIcon height={24} width={24}></HomeIcon>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-bold">Localização</p>
              <p className="text-sm">SP - Brasil</p>
            </div>
        </div>
        <div className="flex items-center justify-around gap-4 p-4 outline-1 outline-double rounded-md outline-gray-300 dark:outline-none dark:bg-slate-800 bg-slate-200">
            <div className="flex items-center justify-center rounded-full ">
              <EnvelopeClosedIcon height={24} width={24}></EnvelopeClosedIcon>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-bold">Email</p>
              <p className="text-sm">matheusaugustosimoes@hotmail.com</p>
            </div>
        </div>
        
      </div>
        
        
      </div>
  
  )
}