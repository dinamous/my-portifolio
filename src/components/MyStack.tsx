
export default function MyStack() {

  const skillIcons = [
    {
      img: "https://skillicons.dev/icons?i=html,css",
      id: 1
    },
    {
      img: "https://skillicons.dev/icons?i=js,ts",
      id: 2
    },
    {
      img: "https://skillicons.dev/icons?i=react,next",
      id: 3
    },
    {
      img: "https://skillicons.dev/icons?i=tailwind,scss",
      id: 4
    },
    {
      img: "https://skillicons.dev/icons?i=nodejs,docker",
      id: 5
    },
    {
      img: "https://skillicons.dev/icons?i=aws,linux",
      id: 6
    },
    {
      img: "https://skillicons.dev/icons?i=firebase,mongo",
      id: 7
    },
    {
      img: "https://skillicons.dev/icons?i=python,tensorflow",
      id: 8
    },
    {
      img: "https://skillicons.dev/icons?i=blender,figma",
      id: 9
    },
  ]

  return (
    <div className="relative py-16 z-auto dark:bg-slate-900 bg-gray-50">
      <div className="mx-auto max-w-6xl flex flex-1 items-center flex-col justify-center  md:flex-row gap-8 md:px-12 ">
        <p className="text-lg font-bold tracking-tight sm:text-2xl w-[40%] text-center sm:text-left ">Minha stack</p>
        <div className="flex gap-4 flex-wrap items-center justify-center sm:justify-start">
          {skillIcons.map(icon => (
            <img className="hover:-translate-y-2 transition-transform ease-in-out duration-300 cursor-pointer" src={icon.img} key={icon.id} />
          ))}
        </div>
      </div>
    </div>
  )
}