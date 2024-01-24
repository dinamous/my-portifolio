import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {HelmetProvider,Helmet} from "react-helmet-async"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
        <Helmet >
          <title>dinamous.dev</title>
          <meta property="og:title" content="Matheus Simões - Desenvolvedor Frontend | Especialista em UI/UX"/>
          <meta property="og:description" content="Sou um apaixonado desenvolvedor frontend com experiência em criar interfaces intuitivas e atraentes para proporcionar a melhor experiência do usuário."/>
          <meta property="og:image" content="https://github.com/dinamous.png" />
          <meta name="keywords" content="Desenvolvedor Frontend, UI/UX Designer, HTML5, CSS3, JavaScript, ReactJS, Angular, Vue.js, Responsive Design, Web Development, Mobile-first Development, Experiência do Usuário, Design de Interface, Prototipagem, LinkedIn"/>
          <meta name="robots" content="index, follow"/>
          <meta property="og:url" rel="canonical" content="https://dinamousdev.vercel.app"/>

           <link rel="author" href="https://www.linkedin.com/dinamous"></link>
           
        </Helmet>
      <App/>
    </HelmetProvider>
  </React.StrictMode>,
)
