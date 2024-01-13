import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ModeToggle } from './mode-toggle'

const navigation = [
  { name: 'Início', href: '#' },
  { name: 'Sobre', href: '#' },
  { name: 'Projetos', href: '#' },
  { name: 'Contato', href: '#' },
]

export default function Example() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div>
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className={`${isScrolled ? 'bg-white dark:bg-slate-900' : 'bg-transparent'} flex items-center justify-between p-2 lg:px-8 fixed w-full top-0 left-0 transition-colors duration-300 ease-in-out`}  aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <h1 className="font-bold text-xl">dinamous.<span className='text-emerald-500'>dev</span>
              </h1>
            </a>
          </div>

           {/* navbar mobile */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Abrir menu</span>
              <Bars3Icon className="h-6 w-6 text-black dark:text-white" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="text-sm mx-2 font-semibold leading-6 text-shadow hover:shadow-emerald-300 ">
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <ModeToggle></ModeToggle>
          </div>
           {/* fim navbar mobile */}
        </nav>
        <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5 lg:hidden md:hidden">
              <h1 className="font-bold text-xl">dinamous.<span className='text-sky-500'>dev</span>
              </h1>
            </a>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 "
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 hover:bg-gray-50 dark:hover:bg-gray-950"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6">
                <ModeToggle></ModeToggle>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>

      
    </div>
  )
}
